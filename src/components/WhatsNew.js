import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import ReleaseList from './ReleaseList';
import { releases } from '../releases';
import { fonts, useTheme } from '../theme';

const KEY = 'last-seen-release';
const FIRST_RELEASE = '1.0.0';

// Shows "What's new" once, the first time the app opens after an update.
//  - A brand new install sees nothing (there is nothing "new" yet).
//  - Someone who was already signed in before this feature existed sees every change since 1.0.0.
export default function WhatsNew({ signedIn }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState([]);
  const latest = releases[0].id;

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored === latest) return;
        if (!signedIn) {
          // Fresh install, still on the login screen: remember the current version.
          if (stored === null) await AsyncStorage.setItem(KEY, latest);
          return;
        }
        const from = stored === null ? FIRST_RELEASE : stored;
        const idx = releases.findIndex((r) => r.id === from);
        const list = idx === -1 ? [releases[0]] : releases.slice(0, idx);
        if (off) return;
        if (list.length > 0) setPending(list);
        else await AsyncStorage.setItem(KEY, latest);
      } catch {
        // if storage fails, just skip the notes
      }
    })();
    return () => { off = true; };
  }, [signedIn, latest]);

  async function close() {
    setPending([]);
    try {
      await AsyncStorage.setItem(KEY, latest);
    } catch {
      // ignore
    }
  }

  return (
    <Modal visible={pending.length > 0} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.dim }]} />
        <View
          style={{
            backgroundColor: t.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
            borderColor: t.border, maxHeight: '88%', paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 16,
          }}
        >
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 24, color: t.text }}>What's new</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2, marginBottom: 16 }}>
            Here is everything that changed in this update.
          </Text>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 16 }}>
            <ReleaseList items={pending} />
          </ScrollView>
          <Button title="Got it" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}
