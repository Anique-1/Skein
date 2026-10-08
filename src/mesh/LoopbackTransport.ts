import { ANNOUNCE_EVERY_MS, MAX_TTL } from '../config';
import { makeId } from './ids';
import { Packet, PacketType, Transport } from './types';

// Pretend people at different distances (in hops) so the UI can be built and tested.
const CAST = [
  { id: 'demo-ada', name: 'ada', dist: 1 },
  { id: 'demo-bo', name: 'bo', dist: 1 },
  { id: 'demo-cleo', name: 'cleo', dist: 2 },
  { id: 'demo-dev', name: 'dev', dist: 3 },
  { id: 'demo-eli', name: 'eli', dist: 5 },
];

const CHATTER = [
  'anyone near the east gate?',
  'power is out on my street, you too?',
  'good signal at the library',
  'meeting at the tea stall in ten',
  'can someone relay this to the market side?',
];

const REPLIES = ['got it', 'on my way', 'same here', 'thanks for the update', 'ha, yes'];

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

type Extra = { type: PacketType; channel?: string; to?: string; body?: string };

export class LoopbackTransport implements Transport {
  readonly label = 'Demo mesh';
  private handler?: (p: Packet) => void;
  private timers: ReturnType<typeof setInterval>[] = [];
  private pending: ReturnType<typeof setTimeout>[] = [];

  async start(onPacket: (p: Packet) => void) {
    this.handler = onPacket;
    const hello = () => CAST.forEach((c) => this.emit(c, { type: 'announce' }));
    this.pending.push(setTimeout(hello, 400));
    this.timers.push(setInterval(hello, ANNOUNCE_EVERY_MS));
    this.timers.push(
      setInterval(
        () => this.emit(pick(CAST), { type: 'chat', channel: 'mesh', body: pick(CHATTER) }),
        14000,
      ),
    );
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.pending.forEach(clearTimeout);
    this.timers = [];
    this.pending = [];
    this.handler = undefined;
  }

  broadcast(p: Packet) {
    if (p.type === 'dm') {
      const c = CAST.find((x) => x.id === p.to);
      if (c) this.later(() => this.emit(c, { type: 'dm', to: p.from, body: pick(REPLIES) }), 1500);
    } else if (p.type === 'chat' && p.channel && Math.random() < 0.6) {
      const ch = p.channel;
      this.later(
        () => this.emit(pick(CAST), { type: 'chat', channel: ch, body: pick(REPLIES) }),
        2200,
      );
    }
  }

  private later(fn: () => void, base: number) {
    this.pending.push(setTimeout(fn, base + Math.random() * 1500));
  }

  private emit(c: (typeof CAST)[number], extra: Extra) {
    const hops = c.dist - 1;
    this.handler?.({
      id: makeId(16),
      ttl: MAX_TTL - hops,
      hops,
      ts: Date.now(),
      from: c.id,
      fromName: c.name,
      ...extra,
    });
  }
}
