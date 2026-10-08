import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkers, PermKey, PermStatus, requesters } from '../permissions';
import { colors, fonts } from '../theme';

interface Row {
  key: PermKey;
  title: string;
  why: string;
  note?: string;
  androidOnly?: boolean;
}

const ROWS: Row[] = [
  {
    key: 'bluetooth',
    title: 'Nearby devices',
    why: 'Lets Skein find and talk to other Skein phones over Bluetooth. No internet needed.',
  },
  {
    key: 'location',
    title: 'Location',
    why: 'Older Android versions need it to scan Bluetooth. Skein also uses it to place you in a chat for your area.',
    note: 'Your coordinates are never saved or sent. Only a rough area code (about 1 km wide) is used.',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    why: 'Tells you when someone sends you a private message.',
  },
  {
    key: 'battery',
    title: 'Keep running in the background',
    why: 'Turn off battery optimization so Skein keeps relaying messages when your screen is off.',
    androidOnly: true,
  },
];

const statusText: Record<PermStatus, string> = {
  granted: 'Allowed',
  denied: 'Blocked, open Settings to change',
  unknown: '',
};

export default function Onboarding({
  initialName,
  onDone,
}: {
  initialName: string;
  onDone: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<Record<PermKey, PermStatus>>({
    bluetooth: 'unknown',
    location: 'unknown',
    notifications: 'unknown',
    battery: 'unknown',
  });
  const [busy, setBusy] = useState(false);

  const rows = ROWS.filter((r) => !r.androidOnly || Platform.OS === 'android');

  const refresh = useCallback(async () => {
    const next = { ...status };
    for (const r of rows) next[r.key] = await checkers[r.key]();
    setStatus(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ask = async (key: PermKey) => {
    try {
      const result = await requesters[key]();
      setStatus((s) => ({ ...s, [key]: result }));
    } catch {
      // permission request failed (e.g. Bluetooth in Expo Go) — ignore and continue
    }
  };

  const askAll = async () => {
    setBusy(true);
    try {
      for (const r of rows) await ask(r.key);
      onDone(name); // always navigate forward regardless of permission outcomes
    } catch {
      onDone(name); // still navigate even if something unexpected throws
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>skein</Text>
        <Text style={styles.tagline}>
          Chat with people around you. No internet, no accounts, no phone numbers.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your name on the mesh</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor={colors.mist}
            placeholder="Pick a name"
          />
          <Text style={styles.small}>Anyone nearby can see this. You can use any name you like.</Text>
        </View>

        <Text style={styles.section}>What Skein needs</Text>
        {rows.map((r) => (
          <View key={r.key} style={styles.permRow}>
            <View style={styles.permText}>
              <Text style={styles.permTitle}>{r.title}</Text>
              <Text style={styles.permWhy}>{r.why}</Text>
              {r.note && <Text style={styles.permNote}>{r.note}</Text>}
              {!!statusText[status[r.key]] && (
                <Text style={status[r.key] === 'granted' ? styles.ok : styles.blocked}>
                  {statusText[status[r.key]]}
                </Text>
              )}
            </View>
            {status[r.key] !== 'granted' && (
              <Pressable
                onPress={() => ask(r.key)}
                style={styles.allow}
                accessibilityRole="button"
                accessibilityLabel={`Allow ${r.title}`}
              >
                <Text style={styles.allowText}>Allow</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={askAll} disabled={busy} style={styles.primary} accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.primaryText}>Allow all and continue</Text>
          )}
        </Pressable>
        <Pressable onPress={() => onDone(name)} disabled={busy} accessibilityRole="button">
          <Text style={styles.skip}>Continue without allowing</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 24, paddingBottom: 16 },
  brand: { color: colors.paper, fontFamily: fonts.display, fontSize: 52, letterSpacing: -1 },
  tagline: { color: colors.mist, fontSize: 16, lineHeight: 23, marginTop: 6, marginBottom: 22 },
  card: { backgroundColor: colors.wool, borderRadius: 20, padding: 16, marginBottom: 26 },
  cardTitle: { color: colors.paper, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.ink,
    color: colors.knot,
    fontSize: 17,
  },
  small: { color: colors.mist, fontSize: 12, marginTop: 8 },
  section: { color: colors.paper, fontFamily: fonts.display, fontSize: 22, marginBottom: 12 },
  permRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.fiber,
  },
  permText: { flex: 1 },
  permTitle: { color: colors.paper, fontSize: 16, fontWeight: '700' },
  permWhy: { color: colors.mist, fontSize: 14, lineHeight: 20, marginTop: 3 },
  permNote: { color: colors.knot, fontSize: 13, lineHeight: 18, marginTop: 6 },
  ok: { color: colors.thread, fontSize: 13, marginTop: 6, fontWeight: '600' },
  blocked: { color: colors.alert, fontSize: 13, marginTop: 6 },
  allow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.thread,
  },
  allowText: { color: colors.thread, fontWeight: '700' },
  footer: { padding: 20, gap: 14, alignItems: 'center' },
  primary: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.thread,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  skip: { color: colors.mist, fontSize: 14, padding: 4 },
});
