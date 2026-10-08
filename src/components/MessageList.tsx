import React, { useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { METERS_PER_HOP } from '../config';
import { colors } from '../theme';
import { ChatMessage } from '../mesh/types';

function Row({ m }: { m: ChatMessage }) {
  const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (m.mine) {
    return (
      <View style={[styles.bubble, styles.mine]}>
        <Text style={styles.mineText}>{m.body}</Text>
        <Text style={styles.mineMeta}>{time}</Text>
      </View>
    );
  }
  const hopsLabel = `${m.hops} hop${m.hops === 1 ? '' : 's'}, about ${m.hops * METERS_PER_HOP} m`;
  return (
    <View style={[styles.bubble, styles.theirs]}>
      <Text style={styles.name}>{m.fromName}</Text>
      <Text style={styles.text}>{m.body}</Text>
      <View style={styles.metaRow} accessible accessibilityLabel={`${hopsLabel}, ${time}`}>
        <View style={styles.stitches}>
          {Array.from({ length: Math.min(m.hops, 7) }, (_, i) => (
            <View key={i} style={styles.stitch} />
          ))}
        </View>
        <Text style={styles.meta}>{`${hopsLabel}, ${time}`}</Text>
      </View>
    </View>
  );
}

export default function MessageList({
  messages,
  empty,
}: {
  messages: ChatMessage[];
  empty: React.ReactNode;
}) {
  const ref = useRef<FlatList<ChatMessage>>(null);
  return (
    <FlatList
      ref={ref}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => <Row m={item} />}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}
      ListEmptyComponent={<View style={styles.empty}>{empty}</View>}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.knot,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.wool,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  name: { color: colors.thread, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  text: { color: colors.paper, fontSize: 16, lineHeight: 22 },
  mineText: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  mineMeta: { color: '#6B5A2E', fontSize: 11, marginTop: 4, textAlign: 'right' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  stitches: { flexDirection: 'row', gap: 3 },
  stitch: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.thread },
  meta: { color: colors.mist, fontSize: 11, flexShrink: 1 },
});
