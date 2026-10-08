import { Linking, PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import { ensureAndroidChannel } from './notifications';

export type PermKey = 'bluetooth' | 'location' | 'notifications' | 'battery';
// 'unknown' = the OS can't tell us (or only asks on first use)
export type PermStatus = 'granted' | 'denied' | 'unknown';

const P = PermissionsAndroid.PERMISSIONS;

function androidBluetoothPerms() {
  return Number(Platform.Version) >= 31
    ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT, P.BLUETOOTH_ADVERTISE]
    : [P.ACCESS_FINE_LOCATION];
}

async function checkBluetooth(): Promise<PermStatus> {
  if (Platform.OS !== 'android') return 'unknown'; // iOS asks when Bluetooth first starts
  const results = await Promise.all(androidBluetoothPerms().map((p) => PermissionsAndroid.check(p)));
  return results.every(Boolean) ? 'granted' : 'denied';
}

async function requestBluetooth(): Promise<PermStatus> {
  if (Platform.OS !== 'android') return 'unknown';
  const perms = androidBluetoothPerms();
  const res = await PermissionsAndroid.requestMultiple(perms);
  return perms.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED) ? 'granted' : 'denied';
}

async function checkLocation(): Promise<PermStatus> {
  const r = await Location.getForegroundPermissionsAsync();
  return r.granted ? 'granted' : r.canAskAgain ? 'unknown' : 'denied';
}

async function requestLocation(): Promise<PermStatus> {
  const r = await Location.requestForegroundPermissionsAsync();
  return r.granted ? 'granted' : 'denied';
}

async function checkNotifications(): Promise<PermStatus> {
  // expo-notifications removed for Expo Go compatibility.
  // Returns 'unknown' so the onboarding button still shows.
  return 'unknown';
}

async function requestNotifications(): Promise<PermStatus> {
  // expo-notifications removed for Expo Go compatibility.
  // Full notification permission is requested in a dev build.
  return 'unknown';
}

// Android can't report this without native code, so we just open the settings screen.
async function requestBattery(): Promise<PermStatus> {
  if (Platform.OS !== 'android') return 'unknown';
  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch {
    await Linking.openSettings();
  }
  return 'unknown';
}

export const checkers: Record<PermKey, () => Promise<PermStatus>> = {
  bluetooth: checkBluetooth,
  location: checkLocation,
  notifications: checkNotifications,
  battery: async () => 'unknown',
};

export const requesters: Record<PermKey, () => Promise<PermStatus>> = {
  bluetooth: requestBluetooth,
  location: requestLocation,
  notifications: requestNotifications,
  battery: requestBattery,
};
