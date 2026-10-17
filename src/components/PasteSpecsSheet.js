import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import { findCpuOption, findGpuOption } from '../lib/hardware';
import { parseWindowsSpecs } from '../lib/specParser';
import { fonts, useTheme } from '../theme';

// "Paste my specs": reads the text Windows copies from Settings > System > About.
export default function PasteSpecsSheet({ visible, onClose, onApply }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  function close() {
    setResult(null);
    onClose();
  }

  const gpuOption = result && result.gpu ? findGpuOption(result.gpu.tier, result.gpu.kind) : null;
  const cpuOption = result && result.cpu ? findCpuOption(result.cpu.tier) : null;
  const small = { fontFamily: fonts.regular, fontSize: 13, color: t.muted, lineHeight: 19 };
  const row = (label, value) => (
    <View key={label} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
      <Text style={[small, { width: 96 }]}>{label}</Text>
      <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: 14, color: t.text, lineHeight: 20 }}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={close} accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: t.dim }]} />
        <View
          style={{
            backgroundColor: t.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
            borderColor: t.border, maxHeight: '92%', paddingTop: 10, paddingHorizontal: 20, paddingBottom: insets.bottom + 12,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, alignSelf: 'center' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>Paste my specs</Text>
            <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Close</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            {!result ? (
              <>
                <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>On your Windows PC</Text>
                  <Text style={small}>1. Open Settings, then System, then About.</Text>
                  <Text style={small}>2. Under Device specifications, click Copy.</Text>
                  <Text style={small}>3. Send that text to your phone (for example, message it to yourself), copy it there, and paste it below.</Text>
                </View>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Paste here"
                  placeholderTextColor={t.muted}
                  multiline
                  accessibilityLabel="Pasted specs"
                  style={{
                    minHeight: 140, maxHeight: 220, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
                    color: t.text, padding: 14, fontFamily: fonts.regular, fontSize: 14, textAlignVertical: 'top',
                  }}
                />
                <Button title="Read my specs" onPress={() => setResult(parseWindowsSpecs(text))} />
              </>
            ) : (
              <>
                <Text style={small}>Here is what we found. Check it, then use it.</Text>
                <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 }}>
                  {result.pcType === 'laptop' && row('Type', 'Laptop')}
                  {cpuOption && row('Processor', `${cpuOption.title}\n${result.cpu.text}`)}
                  {result.ram && row('Memory', `${result.ram} GB`)}
                  {gpuOption && row('Graphics', `${gpuOption.title}\n${result.gpu.text}`)}
                  {result.gpu && result.gpu.kind === 'dedicated' && result.gpu.vramGb && row('Graphics memory', `${result.gpu.vramGb} GB`)}
                  {result.diskFree != null && row('Free disk space', `${result.diskFree} GB`)}
                </View>
                {result.missing.length > 0 && (
                  <Text style={[small, { color: t.link }]}>
                    We could not read: {result.missing.join(', ')}. You can choose those by hand after.
                  </Text>
                )}
                {result.missing.length === 4 && (
                  <Text style={small}>This does not look like the text Windows copies from Settings, System, About. Try copying it again.</Text>
                )}
                <Button
                  title="Use these specs"
                  onPress={() => { onApply(result); close(); }}
                />
                <Button title="Back" variant="secondary" onPress={() => setResult(null)} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
