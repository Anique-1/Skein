import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeinLogo from '../components/SkeinLogo';
import { AppSettings, Identity, Peer } from '../mesh/types';
import { colors, fonts } from '../theme';

interface SettingsModalProps {
  visible: boolean;
  identity: Identity;
  peers: Peer[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({
  visible,
  identity,
  peers,
  settings,
  onUpdateSettings,
  onClose,
}: SettingsModalProps) {
  const setAppearance = (theme: 'system' | 'light' | 'dark') => {
    onUpdateSettings({ ...settings, theme });
  };

  const setPow = (proofOfWork: boolean) => {
    onUpdateSettings({ ...settings, proofOfWork });
  };

  const pubKeyPreview = identity.publicKey
    ? `${identity.publicKey.slice(0, 8)}...${identity.publicKey.slice(-8)}`
    : 'generating...';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.root}>
        {/* Top Bar with Close Button */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <SkeinLogo size={28} animated={false} />
            <Text style={styles.brand}>skein</Text>
            <Text style={styles.version}>v1.0.0</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.tagline}>
            decentralized mesh messaging with end-to-end encryption
          </Text>

          {/* Feature Highlights */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>ᛒ</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Offline Mesh Chat</Text>
                <Text style={styles.featureDesc}>
                  Communicate directly via Bluetooth LE without internet or servers. Messages relay
                  through nearby devices to extend range.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌐</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Geohash Area Channels</Text>
                <Text style={styles.featureDesc}>
                  Connect with people in your area using geohash-based channels. Select custom regions
                  and neighborhoods directly on the map.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>End-to-End Encryption</Text>
                <Text style={styles.featureDesc}>
                  Private messages are cryptographically encrypted. Channel messages are public to
                  the selected area.
                </Text>
              </View>
            </View>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>appearance</Text>
            <View style={styles.toggleRow}>
              {(['system', 'light', 'dark'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setAppearance(t)}
                  style={[styles.toggleBtn, settings.theme === t && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleText, settings.theme === t && styles.toggleTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Proof of Work Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>proof of work</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setPow(false)}
                style={[styles.toggleBtn, !settings.proofOfWork && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, !settings.proofOfWork && styles.toggleTextActive]}>
                  pow off
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPow(true)}
                style={[styles.toggleBtn, settings.proofOfWork && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, settings.proofOfWork && styles.toggleTextActive]}>
                  pow on
                </Text>
              </Pressable>
            </View>
            <Text style={styles.sectionHint}>
              add proof of work to geohash messages for spam deterrence.
            </Text>
          </View>

          {/* Mesh Diagnostic Terminal Status Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>mesh network diagnostic</Text>
            <View style={styles.terminalCard}>
              <Text style={styles.terminalLine}>
                <Text style={styles.terminalKey}>BLE GATT Server: </Text>
                <Text style={styles.terminalValActive}>Active & Advertising</Text>
              </Text>
              <Text style={styles.terminalLine}>
                <Text style={styles.terminalKey}>Mesh Identity: </Text>
                <Text style={styles.terminalVal}>{identity.name} ({identity.id})</Text>
              </Text>
              <Text style={styles.terminalLine}>
                <Text style={styles.terminalKey}>E2EE Public Key: </Text>
                <Text style={styles.terminalVal}>{pubKeyPreview}</Text>
              </Text>
              <Text style={styles.terminalLine}>
                <Text style={styles.terminalKey}>Connected Peers: </Text>
                <Text style={styles.terminalVal}>{peers.length} active node{peers.length === 1 ? '' : 's'}</Text>
              </Text>
              <Text style={styles.terminalLine}>
                <Text style={styles.terminalKey}>Max Relay TTL: </Text>
                <Text style={styles.terminalVal}>7 hops (~210m theoretical radius)</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.fiber,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  version: {
    color: colors.knot,
    fontSize: 12,
    fontFamily: fonts.display,
    marginTop: 4,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeText: {
    color: colors.thread,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
    gap: 22,
  },
  tagline: {
    color: colors.mist,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  featureList: {
    gap: 18,
    backgroundColor: colors.wool,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 22,
    color: colors.knot,
    width: 28,
    textAlign: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    color: colors.mist,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.wool,
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  toggleBtnActive: {
    backgroundColor: colors.thread,
    borderColor: colors.thread,
  },
  toggleText: {
    color: colors.mist,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.ink,
  },
  sectionHint: {
    color: colors.mist,
    fontSize: 12,
    lineHeight: 16,
  },
  terminalCard: {
    backgroundColor: '#0D0A14',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.fiber,
    gap: 6,
  },
  terminalLine: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  terminalKey: {
    color: colors.mist,
  },
  terminalVal: {
    color: colors.paper,
    fontWeight: '600',
  },
  terminalValActive: {
    color: colors.knot,
    fontWeight: '700',
  },
});
