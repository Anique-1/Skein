// 'demo'  -> simulated people, runs in Expo Go, good for UI work.
// 'ble'   -> real Bluetooth transport (needs a dev build + native GATT code, see README).
export const TRANSPORT: 'demo' | 'ble' = 'ble';

export const MAX_TTL = 7; // maximum relays for one message
export const ANNOUNCE_EVERY_MS = 8000; // "I'm here" beacon
export const PEER_TIMEOUT_MS = 30000; // forget peers not heard from
export const SEEN_CACHE_SIZE = 2000; // message IDs remembered for loop prevention

// Rough planning number only. Real range depends on walls, phones and crowds:
// indoors 10-30 m, open air 50-100 m per hop.
export const METERS_PER_HOP = 30;

export const GEOHASH_PRECISION = 6; // about 1.2 km x 0.6 km

// Custom BLE identifiers for the real transport.
export const SERVICE_UUID = '6f1c5e1a-2b7d-4a3e-9d65-5a1e1c0ffee1';
export const PACKET_CHAR_UUID = '6f1c5e1b-2b7d-4a3e-9d65-5a1e1c0ffee1';
