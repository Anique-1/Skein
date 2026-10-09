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
import { Identity, Peer } from '../mesh/types';
import { colors, fonts } from '../theme';

interface SettingsModalProps {
  visible: boolean;
  identity: Identity;
  peers: Peer[];
  onClose: () => void;
}

export default function SettingsModal({
  visible,
  identity,
  peers,
  onClose,
}: SettingsModalProps) {
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
              <Text style={styles.featureIcon}>📍</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Local Area Chat</Text>
                <Text style={styles.featureDesc}>
                  Automatic area channels based on rough local geohash. Your exact GPS coordinates are
                  never saved or broadcast.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>End-to-End Encryption</Text>
                <Text style={styles.featureDesc}>
                  Private 1-to-1 direct messages are cryptographically encrypted. Broadcast nearby
                  messages are public.
                </Text>
              </View>
            </View>
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
