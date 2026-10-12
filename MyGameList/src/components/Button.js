import { ActivityIndicator, Pressable, Text } from 'react-native';
import { fonts, useTheme } from '../theme';

export default function Button({ title, onPress, loading = false, variant = 'primary' }) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: loading, busy: loading }}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? t.red : t.surface,
        borderWidth: primary ? 0 : 1,
        borderColor: t.border,
        opacity: pressed || loading ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={primary ? t.onRed : t.text} />
      ) : (
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: primary ? t.onRed : t.text }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
