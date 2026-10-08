export type PacketType = 'announce' | 'chat' | 'dm';

export interface Packet {
  id: string;
  type: PacketType;
  ttl: number; // relays left
  hops: number; // relays so far (0 = heard straight from the sender)
  ts: number;
  from: string;
  fromName: string;
  to?: string; // dm only
  channel?: string; // chat only: 'mesh' or 'geo:<hash>'
  body?: string;
}

export interface Peer {
  id: string;
  name: string;
  hops: number; // distance in hops (1 = direct neighbour)
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  channel: string; // 'mesh' | 'geo:<hash>' | 'dm:<peerId>'
  from: string;
  fromName: string;
  body: string;
  ts: number;
  hops: number;
  mine: boolean;
}

export interface Identity {
  id: string;
  name: string;
}

export interface Transport {
  readonly label: string;
  start(onPacket: (p: Packet) => void): Promise<void>;
  stop(): void;
  broadcast(p: Packet): void;
}
