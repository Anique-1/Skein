import AsyncStorage from '@react-native-async-storage/async-storage';
import { Identity } from './mesh/types';

const KEY = 'skein.state.v1';

export interface Saved {
  identity: Identity;
  onboarded: boolean;
}

export async function loadState(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export async function saveState(s: Saved) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage is best-effort
  }
}

const BIRDS = ['heron', 'finch', 'wren', 'swift', 'plover', 'lark', 'tern', 'kite', 'ibis', 'egret'];

export function randomName(): string {
  const bird = BIRDS[Math.floor(Math.random() * BIRDS.length)];
  return `${bird}-${Math.floor(100 + Math.random() * 900)}`;
}
