import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initNotifications } from './src/notifications';
import { makeId } from './src/mesh/ids';
import { Identity } from './src/mesh/types';
import Home from './src/screens/Home';
import Onboarding from './src/screens/Onboarding';
import SkeinLogo from './src/components/SkeinLogo';
import { loadState, randomName, saveState } from './src/storage';
import { colors, fonts } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      // Initialize notifications
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
        <View style={styles.splashContainer}>
          <SkeinLogo size={120} animated={true} />
          <Text style={styles.splashBrand}>skein</Text>
          <Text style={styles.splashTagline}>offline bluetooth mesh</Text>
        </View>
      ) : onboarded ? (
        <Home identity={identity} />
      ) : (
        <Onboarding initialName={identity.name} onDone={finish} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  splashBrand: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  splashTagline: {
    color: colors.mist,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

