import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initNotifications } from './src/notifications';
import { makeId } from './src/mesh/ids';
import { Identity } from './src/mesh/types';
import Home from './src/screens/Home';
import Onboarding from './src/screens/Onboarding';
import { loadState, randomName, saveState } from './src/storage';
import { colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      // Initialize notifications lazily so Expo Go doesn't crash at startup.
      initNotifications().catch(() => {});
      const saved = await loadState();
      if (saved) {
        setIdentity(saved.identity);
        setOnboarded(saved.onboarded);
      } else {
        setIdentity({ id: makeId(16), name: randomName() });
      }
      setReady(true);
    })();
  }, []);

  const finish = async (name: string) => {
    if (!identity) return;
    const next: Identity = { ...identity, name: name.trim() || identity.name };
    await saveState({ identity: next, onboarded: true });
    setIdentity(next);
    setOnboarded(true);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!ready || !identity ? (
        <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: 'center' }}>
          <ActivityIndicator color={colors.thread} />
        </View>
      ) : onboarded ? (
        <Home identity={identity} />
      ) : (
        <Onboarding initialName={identity.name} onDone={finish} />
      )}
    </SafeAreaProvider>
  );
}
