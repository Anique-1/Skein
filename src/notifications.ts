/**
 * Notification stubs — Expo Go compatible.
 *
 * expo-notifications registers Android push-token listeners at module-load
 * time, which crashes Expo Go since SDK 53. Removing it from the bundle
 * entirely is the only way to prevent the crash.
 *
 * These are no-ops so the full app runs in Expo Go (demo mesh, map, chat,
 * area geohash — everything except DM push alerts).
 *
 * To enable real local-push notifications for DMs, build a dev client:
 *   npx expo run:android
 *
 * Then re-add the package and restore the real implementation:
 *   npx expo install expo-notifications
 */

export async function initNotifications(): Promise<void> {}

export async function ensureAndroidChannel(): Promise<void> {}

export async function notifyDirect(_name: string, _body: string): Promise<void> {}
