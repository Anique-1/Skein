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
import SkeinLogo from '../components/SkeinLogo';
import { checkers, PermKey, PermStatus, requesters } from '../permissions';
import { colors, fonts } from '../theme';

interface Row {
  key: PermKey;
  icon: string;
  title: string;
  why: string;
  note?: string;
  androidOnly?: boolean;
}

const ROWS: Row[] = [
  {
    key: 'bluetooth',
    icon: 'ᛒ',
    title: 'Nearby Devices',
    why: 'Required to discover and message nearby Skein users via Bluetooth Low Energy.',
  },
  {
    key: 'location',
    icon: '📍',
    title: 'Precise Location',
    why: 'Required by Android to discover nearby Skein users via Bluetooth.',
    note: '⚠️ Skein does NOT track or store your location.',
  },
  {
    key: 'notifications',
    icon: '🔔',
    title: 'Notifications',
    why: 'Receive notifications when you receive private encrypted messages.',
  },
  {
    key: 'battery',
    icon: '🔋',
    title: 'Battery Optimization',
    why: 'Disable battery optimization to ensure Skein runs reliably in the background and maintains mesh network connections.',
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
      // ignore
    }
  };

  const askAll = async () => {
    setBusy(true);
    try {
      for (const r of rows) await ask(r.key);
      onDone(name);
    } catch {
      onDone(name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <SkeinLogo size={44} animated={true} />
          <Text style={styles.brand}>skein</Text>
        </View>
        <Text style={styles.tagline}>
          decentralized mesh messaging with end-to-end encryption
        </Text>

        {/* Privacy Highlight Card */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyIcon}>🛡️</Text>
            <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
          </View>
          <View style={styles.privacyBullets}>
            <Text style={styles.privacyBullet}>• no tracking or data collection</Text>
            <Text style={styles.privacyBullet}>• Bluetooth mesh chats are fully offline</Text>
            <Text style={styles.privacyBullet}>• Geohash channels stay within chosen area</Text>
            <Text style={styles.privacyBullet}>• Private direct messages are end-to-end encrypted</Text>
          </View>
        </View>

        {/* Identity Card */}
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
          <Text style={styles.small}>Anyone nearby can see this. You can use any handle you like.</Text>
        </View>

        {/* Permissions Section */}
        <Text style={styles.section}>permissions</Text>
        {rows.map((r) => (
          <View key={r.key} style={styles.permRow}>
            <Text style={styles.permIcon}>{r.icon}</Text>
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

      {/* Action Footer */}
      <View style={styles.footer}>
        <Pressable onPress={askAll} disabled={busy} style={styles.primary} accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.primaryText}>Grant Permissions</Text>
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
  content: { padding: 22, paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brand: { color: colors.paper, fontFamily: fonts.display, fontSize: 42, letterSpacing: -1 },
  tagline: { color: colors.mist, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 18 },
  privacyCard: {
    backgroundColor: '#0D0A14',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.fiber,
    gap: 8,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyIcon: {
    fontSize: 16,
  },
  privacyTitle: {
    color: colors.knot,
    fontSize: 15,
    fontWeight: '700',
  },
  privacyBullets: {
    gap: 4,
    paddingLeft: 4,
  },
  privacyBullet: {
    color: colors.mist,
    fontSize: 13,
    lineHeight: 18,
  },
  card: { backgroundColor: colors.wool, borderRadius: 18, padding: 16, marginBottom: 22 },
  cardTitle: { color: colors.paper, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.ink,
    color: colors.knot,
    fontSize: 16,
  },
  small: { color: colors.mist, fontSize: 12, marginTop: 8 },
  section: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  permRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.fiber,
  },
  permIcon: {
    fontSize: 20,
    color: colors.knot,
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  permText: { flex: 1 },
  permTitle: { color: colors.paper, fontSize: 15, fontWeight: '700' },
  permWhy: { color: colors.mist, fontSize: 13, lineHeight: 18, marginTop: 3 },
  permNote: { color: colors.knot, fontSize: 12, lineHeight: 17, marginTop: 5 },
  ok: { color: colors.thread, fontSize: 12, marginTop: 5, fontWeight: '700' },
  blocked: { color: colors.alert, fontSize: 12, marginTop: 5 },
  allow: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.thread,
  },
  allowText: { color: colors.thread, fontWeight: '700', fontSize: 13 },
  footer: { padding: 20, gap: 12, alignItems: 'center' },
  primary: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.thread,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  skip: { color: colors.mist, fontSize: 13, padding: 4 },
});
