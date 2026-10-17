import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compareVersions, fetchLatestApk, installedVersion } from '../lib/version';
import { fonts, useTheme } from '../theme';

const KEY = 'dismissed-apk-version';

// Shows a card when a newer app file (APK) is listed in the app_versions table.
// Without the Play Store, this is how installed apps find out about new builds.
export default function NewVersionCard() {
  const t = useTheme();
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let off = false;
    (async () => {
      const found = await fetchLatestApk();
      if (off || !found) return;
      if (compareVersions(found.version, installedVersion()) <= 0) return;
      const dismissed = await AsyncStorage.getItem(KEY).catch(() => null);
      if (!off && dismissed !== found.version) setLatest(found);
    })();
    return () => { off = true; };
  }, []);

  if (!latest) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: t.surface, borderColor: t.red, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, gap: 6 }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>Version {latest.version} is available</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, lineHeight: 19 }}>
        {latest.notes ? String(latest.notes).slice(0, 160) : 'Download it to get the newest features.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Pressable
          onPress={() => Linking.openURL(latest.apk_url)}
          accessibilityRole="button"
          style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.onRed }}>Download</Text>
        </Pressable>
        <Pressable
          onPress={() => { AsyncStorage.setItem(KEY, latest.version).catch(() => {}); setLatest(null); }}
          accessibilityRole="button"
          style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.text }}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}
