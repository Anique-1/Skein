import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Identity } from './mesh/types';
import { generateKeyPair } from './mesh/crypto';

const STATE_KEY = 'skein.state.v1';
const SETTINGS_KEY = 'skein.settings.v1';

export interface Saved {
  identity: Identity;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  proofOfWork: false,
  torRelay: false,
  customGeohashes: [],
};

export async function loadState(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!saved.identity.publicKey || !saved.identity.privateKey) {
      const keys = await generateKeyPair();
      saved.identity.publicKey = keys.publicKey;
      saved.identity.privateKey = keys.privateKey;
      await saveState(saved);
    }
    return saved;
  } catch {
    return null;
  }
}

export async function saveState(s: Saved) {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    // storage is best-effort
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage is best-effort
  }
}

const BIRDS = ['heron', 'finch', 'wren', 'swift', 'plover', 'lark', 'tern', 'kite', 'ibis', 'egret'];

export function randomName(): string {
  const bird = BIRDS[Math.floor(Math.random() * BIRDS.length)];
  return `${bird}-${Math.floor(100 + Math.random() * 900)}`;
}
