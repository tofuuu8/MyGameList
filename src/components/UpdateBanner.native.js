import { useEffect } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';

// In the installed app, quietly looks for a new version whenever the app is opened.
// When one has been downloaded, shows a small bar with a Restart button.
// (In Expo Go and during development, updates are switched off, so nothing happens.)
export default function UpdateBanner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled) return undefined;
    const check = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // no connection or no update: try again next time
      }
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);

  if (!isUpdatePending) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute', left: 16, right: 16, top: insets.top + 8, zIndex: 100,
        backgroundColor: t.red, borderRadius: 14, paddingVertical: 10, paddingLeft: 16, paddingRight: 8,
        flexDirection: 'row', alignItems: 'center', gap: 8,
      }}
    >
      <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: 14, color: t.onRed }}>
        A new version is ready.
      </Text>
      <Pressable
        onPress={() => Updates.reloadAsync()}
        accessibilityRole="button"
        accessibilityLabel="Restart to update"
        style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.onRed }}>Restart</Text>
      </Pressable>
    </View>
  );
}
