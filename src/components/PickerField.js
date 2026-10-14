import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';

// A field that shows the current choice and opens a list of options to pick from.
// groups: [{ title?: string, options: [{ key, title, detail }] }]
export default function PickerField({ label, sheetTitle, value, placeholder, groups, selectedKey, onSelect }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        style={{
          minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
          paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
        }}
      >
        <Text numberOfLines={2} style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: value ? t.text : t.muted }}>
          {value || placeholder}
        </Text>
        <Text style={{ color: t.muted, fontSize: 20 }}>›</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
            style={[StyleSheet.absoluteFill, { backgroundColor: t.dim }]}
          />
          <View
            style={{
              backgroundColor: t.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
              borderColor: t.border, maxHeight: '88%', paddingTop: 10, paddingBottom: insets.bottom + 12,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
              <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>{sheetTitle}</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              {groups.map((g, gi) => (
                <View key={g.title || gi} style={{ marginBottom: 8 }}>
                  {!!g.title && (
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: t.muted, marginTop: 8, marginBottom: 4 }}>
                      {g.title}
                    </Text>
                  )}
                  {g.options.map((o) => {
                    const on = o.key === selectedKey;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => { onSelect(o); setOpen(false); }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={{
                          minHeight: 56, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, borderRadius: 12,
                          borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: t.surface,
                          flexDirection: 'row', alignItems: 'center', gap: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>{o.title}</Text>
                          {!!o.detail && (
                            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginTop: 2, lineHeight: 17 }}>
                              {o.detail}
                            </Text>
                          )}
                        </View>
                        {on && <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.link }}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
