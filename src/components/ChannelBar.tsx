import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export interface Tab {
  key: string;
  label: string;
  badge?: number;
}

export default function ChannelBar({
  tabs,
  active,
  onSelect,
  onOpenMap,
}: {
  tabs: Tab[];
  active: string;
  onSelect: (key: string) => void;
  onOpenMap?: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onSelect(t.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.pill, on && styles.pillOn]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            {!!t.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {onOpenMap && (
        <Pressable
          onPress={onOpenMap}
          accessibilityRole="button"
          accessibilityLabel="Open Geohash Map Picker"
          style={styles.mapBtn}
        >
          <Text style={styles.mapBtnText}>🗺️ + Area</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.wool,
  },
  pillOn: { backgroundColor: colors.thread },
  label: { color: colors.mist, fontSize: 14, fontWeight: '600' },
  labelOn: { color: colors.ink },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.knot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.wool,
    borderWidth: 1,
    borderColor: colors.knot,
  },
  mapBtnText: {
    color: colors.knot,
    fontSize: 13,
    fontWeight: '700',
  },
});
