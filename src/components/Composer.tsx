import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export default function Composer({
  placeholder,
  disabled,
  onSend,
}: {
  placeholder: string;
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const canSend = !disabled && text.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };
  return (
    <View style={styles.bar}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.mist}
        style={styles.input}
        maxLength={300}
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={submit}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={submit}
        disabled={!canSend}
        accessibilityRole="button"
        style={[styles.send, !canSend && styles.sendOff]}
      >
        <Text style={[styles.sendText, !canSend && styles.sendTextOff]}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.fiber,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: colors.wool,
    color: colors.paper,
    fontSize: 16,
  },
  send: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.thread,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: colors.wool },
  sendText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  sendTextOff: { color: colors.mist },
});
