import { ANNOUNCE_EVERY_MS, MAX_TTL, PEER_TIMEOUT_MS, SEEN_CACHE_SIZE } from '../config';
import { decryptDirectMessage, encryptDirectMessage } from './crypto';
import { makeId } from './ids';
import { ChatMessage, Identity, Packet, Peer, Transport } from './types';

export interface EngineState {
  peers: Peer[];
  messages: ChatMessage[];
  transportLabel: string;
}

type Listener = () => void;

/**
 * Flood-with-TTL relay with End-to-End Encryption (E2EE) for DMs.
 * Every phone:
 *  1. ignores packets it has already seen (loop prevention),
 *  2. keeps & decrypts packets meant for it,
 *  3. forwards encrypted packets with ttl-1 after a tiny random delay.
 */
export class MeshEngine {
  private seen = new Map<string, number>();
  private peers = new Map<string, Peer>();
  private messages: ChatMessage[] = [];
  private listeners = new Set<Listener>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private snapshot: EngineState;

  onDirect?: (m: ChatMessage) => void;

  constructor(private transport: Transport, private me: Identity) {
    this.snapshot = this.build();
  }

  getState = (): EngineState => this.snapshot;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  async start() {
    await this.transport.start((p) => this.receive(p));
    this.announce();
    this.timers.push(setInterval(() => this.announce(), ANNOUNCE_EVERY_MS));
    this.timers.push(setInterval(() => this.prune(), 5000));
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.transport.stop();
  }

  async send(channel: string, text: string) {
    const body = text.trim();
    if (!body || !channel) return;
    const isDm = channel.startsWith('dm:');
    const recipientId = isDm ? channel.slice(3) : undefined;
    const recipientPeer = recipientId ? this.peers.get(recipientId) : undefined;

    let outgoingBody = body;
    let isEncrypted = false;

    // E2EE for DMs if keys are available
    if (isDm && this.me.privateKey && recipientPeer?.publicKey) {
      outgoingBody = await encryptDirectMessage(body, this.me.privateKey, recipientPeer.publicKey);
      isEncrypted = true;
    }

    const p: Packet = {
      id: makeId(16),
      type: isDm ? 'dm' : 'chat',
      ttl: MAX_TTL,
      hops: 0,
      ts: Date.now(),
      from: this.me.id,
      fromName: this.me.name,
      publicKey: this.me.publicKey,
      to: recipientId,
      channel: isDm ? undefined : channel,
      body: outgoingBody,
      encrypted: isEncrypted,
    };

    this.remember(p.id);

    // Save local readable copy
    this.addMessage(
      { ...p, body },
      channel,
      true,
      isEncrypted,
    );

    this.transport.broadcast(p);
  }

  // ---- internals ----
  private announce() {
    const p: Packet = {
      id: makeId(16),
      type: 'announce',
      ttl: MAX_TTL,
      hops: 0,
      ts: Date.now(),
      from: this.me.id,
      fromName: this.me.name,
      publicKey: this.me.publicKey,
    };
    this.remember(p.id);
    this.transport.broadcast(p);
  }

  private async receive(p: Packet) {
    if (p.from === this.me.id || this.seen.has(p.id)) return;
    this.remember(p.id);

    let forMe = false;
    if (p.type === 'announce') {
      this.peers.set(p.from, {
        id: p.from,
        name: p.fromName,
        publicKey: p.publicKey,
        hops: p.hops + 1,
        lastSeen: Date.now(),
      });
      this.emit();
    } else if (p.type === 'chat' && p.channel) {
      this.addMessage(p, p.channel, false, false);
    } else if (p.type === 'dm' && p.to === this.me.id) {
      forMe = true;
      let plainBody = p.body ?? '';
      let decrypted = false;

      // Attempt E2EE decryption
      if (p.body?.startsWith('enc:v1:') && this.me.privateKey && p.publicKey) {
        const res = await decryptDirectMessage(p.body, this.me.privateKey, p.publicKey);
        plainBody = res.text;
        decrypted = res.success;
      }

      const m = this.addMessage({ ...p, body: plainBody }, `dm:${p.from}`, false, decrypted);
      this.onDirect?.(m);
    }

    if (!forMe && p.ttl > 1) {
      const next: Packet = { ...p, ttl: p.ttl - 1, hops: p.hops + 1 };
      setTimeout(() => this.transport.broadcast(next), 20 + Math.random() * 60);
    }
  }

  private addMessage(p: Packet, channel: string, mine: boolean, encrypted = false): ChatMessage {
    const m: ChatMessage = {
      id: p.id,
      channel,
      from: p.from,
      fromName: p.fromName,
      body: p.body ?? '',
      ts: p.ts,
      hops: p.hops + 1,
      mine,
      encrypted,
    };
    this.messages = [...this.messages, m].slice(-500);
    this.emit();
    return m;
  }

  private remember(id: string) {
    this.seen.set(id, Date.now());
    if (this.seen.size > SEEN_CACHE_SIZE) {
      const oldest = this.seen.keys().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
  }

  private prune() {
    const now = Date.now();
    let changed = false;
    for (const [id, peer] of this.peers) {
      if (now - peer.lastSeen > PEER_TIMEOUT_MS) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) this.emit();
  }

  private build(): EngineState {
    return {
      peers: [...this.peers.values()].sort(
        (a, b) => a.hops - b.hops || a.name.localeCompare(b.name),
      ),
      messages: this.messages,
      transportLabel: this.transport.label,
    };
  }

  private emit() {
    this.snapshot = this.build();
    this.listeners.forEach((l) => l());
  }
}
