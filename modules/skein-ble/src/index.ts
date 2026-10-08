import SkeinBleModule from './SkeinBleModule';

export interface PacketEvent {
  payload: string;
}

export interface Subscription {
  remove(): void;
}

export function start(serviceUuid: string, charUuid: string): Promise<void> {
  return SkeinBleModule.start(serviceUuid, charUuid);
}

export function stop(): Promise<void> {
  return SkeinBleModule.stop();
}

export function broadcast(payload: string): Promise<void> {
  return SkeinBleModule.broadcast(payload);
}

export function addPacketListener(listener: (event: PacketEvent) => void): Subscription {
  try {
    return SkeinBleModule.addListener('onPacketReceived', listener);
  } catch {
    return { remove: () => {} };
  }
}
