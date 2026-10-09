import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChannelBar, { Tab } from '../components/ChannelBar';
import Composer from '../components/Composer';
import KnotMap from '../components/KnotMap';
import MessageList from '../components/MessageList';
import SkeinLogo from '../components/SkeinLogo';
import { METERS_PER_HOP } from '../config';
import { useArea } from '../location/useArea';
import { BleTransport } from '../mesh/BleTransport';
import { MeshEngine } from '../mesh/MeshEngine';
import { Identity } from '../mesh/types';
import { useEngineState } from '../mesh/useEngineState';
import { notifyDirect } from '../notifications';
import { colors, fonts } from '../theme';
import SettingsModal from './SettingsModal';

export default function Home({ identity }: { identity: Identity }) {
  const { width } = useWindowDimensions();
  const [engine, setEngine] = useState<MeshEngine | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState('mesh');
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);

  const tabRef = useRef(tab);
  const area = useArea();
  const state = useEngineState(engine);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // Start the real Bluetooth mesh engine
  useEffect(() => {
    let cancelled = false;
    let running: MeshEngine | null = null;

    const wire = (e: MeshEngine) => {
      e.onDirect = (m) => {
        const key = `dm:${m.from}`;
        const viewing = AppState.currentState === 'active' && tabRef.current === key;
        if (viewing) return;
        setUnread((u) => ({ ...u, [key]: (u[key] ?? 0) + 1 }));
        notifyDirect(m.fromName, m.body).catch(() => {});
      };
    };

    (async () => {
      const transport = new BleTransport();
      const e = new MeshEngine(transport, identity);
      try {
        await e.start();
        setNotice(null);
      } catch (err) {
        setNotice(
          (err as Error)?.message ||
            'Bluetooth mesh could not start. Please ensure Bluetooth and permissions are enabled.',
        );
      }
      if (cancelled) {
        e.stop();
        return;
      }
      wire(e);
      running = e;
      setEngine(e);
    })();

    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [identity]);

  const defaultAreaChannel = area.geohash ? `geo:${area.geohash}` : '';
  const activeChannel = tab === 'area' ? defaultAreaChannel : tab;

  const messages = useMemo(
    () => state.messages.filter((m) => m.channel === activeChannel),
    [state.messages, activeChannel],
  );

  const tabs: Tab[] = [
    { key: 'mesh', label: 'Nearby' },
    { key: 'area', label: area.geohash ? `Area #${area.geohash}` : 'Area' },
    ...state.peers.map((p) => ({
      key: `dm:${p.id}`,
      label: p.name,
      badge: unread[`dm:${p.id}`],
    })),
  ];

  const select = (key: string) => {
    setTab(key);
    setUnread((u) => (u[key] ? { ...u, [key]: 0 } : u));
  };

  const peerName = (id: string) =>
    state.peers.find((p) => p.id === id)?.name ??
    state.messages.find((m) => m.from === id)?.fromName ??
    'this person';

  const farthest = state.peers.reduce((m, p) => Math.max(m, p.hops), 0);
  const isDm = tab.startsWith('dm:');

  let subtitle = 'Everyone in range. Messages hop from phone to phone, up to 7 times.';
  if (tab === 'area') subtitle = 'People in your neighborhood, about 1 km wide.';
  if (isDm) subtitle = `🔒 Private end-to-end encrypted message to ${peerName(tab.slice(3))}`;

  let empty: React.ReactNode = (
    <Text style={styles.emptyText}>
      {isDm
        ? 'Say hello. End-to-end encrypted. Only this person can read it.'
        : 'No messages yet. Say hi to people nearby.'}
    </Text>
  );

  if (tab === 'area' && area.status !== 'ready') {
    empty = (
      <View style={styles.areaCard}>
        <Text style={styles.areaTitle}>
          {area.status === 'loading' ? 'Finding your area' : 'Area chat needs your location'}
        </Text>
        <Text style={styles.emptyText}>
          {area.status === 'loading' && 'Checking your rough position. This takes a few seconds.'}
          {area.status === 'denied' &&
            'Allow location in Settings. Skein turns it into a rough area code and never saves your coordinates.'}
          {area.status === 'error' && 'Skein could not read your location. Check that location is on, then try again.'}
        </Text>
        {area.status === 'denied' && (
          <Pressable style={styles.areaBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.areaBtnText}>Open Settings</Text>
          </Pressable>
        )}
        {area.status === 'error' && (
          <Pressable style={styles.areaBtn} onPress={area.refresh}>
            <Text style={styles.areaBtnText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {/* Header with Logo, Status, and Settings */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <SkeinLogo size={32} animated={state.peers.length > 0} />
            <Text style={styles.brand}>skein</Text>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, notice ? styles.statusDotError : styles.statusDotActive]} />
              <Text style={styles.statusText}>{notice ? 'Bluetooth off' : 'BLE Active'}</Text>
            </View>

            <Pressable
              onPress={() => setShowSettings(true)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Text style={styles.iconBtnText}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}

        {/* Radar Knot Map */}
        <View style={styles.mapWrap}>
          <KnotMap peers={state.peers} width={width - 32} />
          <Text style={styles.reach}>
            {state.peers.length === 0
              ? 'Looking for nearby Skein phones over Bluetooth...'
              : `${state.peers.length} ${state.peers.length === 1 ? 'person' : 'people'} in range. Farthest is ${farthest} hop${farthest === 1 ? '' : 's'} away, about ${farthest * METERS_PER_HOP} m.`}
          </Text>
        </View>

        {/* Channel Navigation */}
        <ChannelBar tabs={tabs} active={tab} onSelect={select} />

        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Messages */}
        <View style={styles.flex}>
          <MessageList messages={messages} empty={empty} />
        </View>

        {/* Composer */}
        <Composer
          placeholder={
            isDm
              ? `Message ${peerName(tab.slice(3))}`
              : 'Message people nearby'
          }
          disabled={!activeChannel || !engine}
          onSend={(text) => engine?.send(activeChannel, text)}
        />
      </KeyboardAvoidingView>

      {/* Settings & Info Modal */}
      <SettingsModal
        visible={showSettings}
        identity={identity}
        peers={state.peers}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: { color: colors.paper, fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.5 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.wool,
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: colors.knot,
  },
  statusDotError: {
    backgroundColor: colors.alert,
  },
  statusText: { color: colors.mist, fontSize: 11, fontWeight: '600' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.wool,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  iconBtnText: {
    fontSize: 14,
  },
  notice: { color: colors.alert, fontSize: 12, paddingHorizontal: 20, paddingTop: 6 },
  mapWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 22,
    backgroundColor: colors.wool,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  reach: { color: colors.mist, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  subtitle: { color: colors.mist, fontSize: 12, paddingHorizontal: 20, paddingTop: 8 },
  emptyText: { color: colors.mist, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  areaCard: { alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  areaTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 20, textAlign: 'center' },
  areaBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.thread,
  },
  areaBtnText: { color: colors.ink, fontWeight: '700' },
});
