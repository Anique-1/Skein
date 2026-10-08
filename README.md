# Skein

Offline mesh chat for people standing near each other. React Native (Expo + TypeScript).

## Run it

```bash
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start              # scan the QR code with Expo Go
```

This starts in **demo mode**: five simulated people at 1, 1, 2, 3 and 5 hops. You can
test onboarding, permissions, notifications, the map, area chat and private chat on a
real phone without a second device.

Notifications and Bluetooth need a development build for full behaviour:

```bash
npx expo run:android        # or run:ios (needs a Mac)
```

## What is in the app

| Feature | Where |
|---|---|
| Permission onboarding (Nearby devices, Location, Notifications, Battery) | `src/screens/Onboarding.tsx`, `src/permissions.ts` |
| Knot map: you in the middle, one ring per hop | `src/components/KnotMap.tsx` |
| Relay engine: dedupe, TTL, peer table, private messages | `src/mesh/MeshEngine.ts` |
| Area chat from your location (geohash, coordinates are discarded) | `src/location/` |
| Private-message notifications (Android channel + iOS) | `src/notifications.ts` |
| Demo transport (fake people) | `src/mesh/LoopbackTransport.ts` |
| Real Bluetooth transport | `src/mesh/BleTransport.ts` (placeholder, see below) |

Check the relay logic any time: `npm run test:mesh` (six phones in a line, only
neighbours can hear each other).

## How far does it reach?

Each phone passes a message on to the phones it can hear. One "hop" is one Bluetooth link.

| Place | Typical range per hop |
|---|---|
| Indoors, walls and people | 10 to 30 m |
| Open air | 50 to 100 m |

Maximum 7 hops (`MAX_TTL`), so a message can cover roughly 200 m indoors and 500 m or
more outdoors, but only if phones are spaced along the whole path. The app shows
"about N m" using `METERS_PER_HOP = 30` in `src/config.ts`. Treat it as an estimate.

## Going real: Bluetooth (the part still to build)

The mesh logic and the UI are finished and tested in simulation. What is missing is
the radio, in `src/mesh/BleTransport.ts`:

1. A phone must **scan and connect** (BLE central) and also **advertise and host a
   GATT server** (BLE peripheral), using `SERVICE_UUID` and `PACKET_CHAR_UUID`
   from `src/config.ts`.
2. `react-native-ble-plx` covers the central side. The peripheral side needs a small
   native module (Kotlin `BluetoothGattServer`, Swift `CBPeripheralManager`).
3. Encode each `Packet` (JSON or binary), split it to the negotiated MTU, write it to
   every connected neighbour, and call `onPacket` for packets you receive.
4. Set `TRANSPORT = 'ble'` in `src/config.ts`. If the transport fails to start, the
   app shows a notice and falls back to the demo mesh.

## Not done yet (be aware before shipping)

- **No encryption.** Private messages are addressed to one person, but relays can
  read them. Add key exchange and authenticated encryption (for example libsodium)
  before calling them private.
- **Area chat is local only.** It needs an internet relay (Nostr or your own server)
  to reach other people in the same geohash.
- **iOS background:** Bluetooth in the background is restricted by iOS, so the mesh
  works best with the app open.
- No store-and-forward, fragmentation of long messages, or spam limits yet.

## Name and look

Skein: a loose coil of thread, many strands joined into one. Palette: aubergine ink
`#15111F`, wool `#231B33`, rose thread `#F2A7C3`, gold knot `#F6D186`.
