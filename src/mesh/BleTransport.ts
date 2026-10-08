import { PACKET_CHAR_UUID, SERVICE_UUID } from '../config';
import { Packet, Transport } from './types';
import * as SkeinBle from 'skein-ble';

/**
 * Real offline Bluetooth Low Energy transport for Skein.
 * Uses native BLE Peripheral (GATT server + advertising) and
 * BLE Central (scanning + client connections).
 */
export class BleTransport implements Transport {
  readonly label = 'Bluetooth mesh';
  private subscription: { remove: () => void } | null = null;

  async start(onPacket: (p: Packet) => void): Promise<void> {
    this.subscription = SkeinBle.addPacketListener((event) => {
      try {
        const parsed = JSON.parse(event.payload) as Packet;
        if (parsed && parsed.id && parsed.type) {
          onPacket(parsed);
        }
      } catch {
        // ignore malformed packets
      }
    });

    await SkeinBle.start(SERVICE_UUID, PACKET_CHAR_UUID);
  }

  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    SkeinBle.stop().catch(() => {});
  }

  broadcast(p: Packet): void {
    try {
      const payload = JSON.stringify(p);
      SkeinBle.broadcast(payload).catch(() => {});
    } catch {
      // ignore serialization failure
    }
  }
}
