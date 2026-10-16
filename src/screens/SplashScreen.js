import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LogoMark, Wordmark } from '../components/Logo';
import { fonts, TAGLINE, useTheme } from '../theme';

// Shown while fonts load and the saved login is checked.
export default function SplashScreen() {
  const t = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {/* Mark sits at the exact center, matching the native splash image. */}
      <View style={styles.center}>
        <LogoMark width={150} body={t.red} detail={t.bg} />
        <View style={styles.wordmark}>
          <Wordmark size={38} />
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={[styles.track, { backgroundColor: t.track }]}>
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: t.red,
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] }),
              },
            ]}
          />
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 16 }}>
          {TAGLINE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Written out in full: the shortcut StyleSheet.absoluteFillObject is no longer available in newer React Native.
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  wordmark: { position: 'absolute', top: '50%', marginTop: 70 },
  bottom: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  track: { width: 120, height: 4, borderRadius: 99, overflow: 'hidden' },
  bar: { height: 4, borderRadius: 99 },
});
