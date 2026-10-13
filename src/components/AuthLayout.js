import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';

// Shared page layout: back button, big title, short subtitle, content, optional footer.
export default function AuthLayout({ onBack, title, subtitle, children, footer }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.border,
            backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.text, fontSize: 22, marginTop: -2 }}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text, marginTop: 22 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, marginTop: 4, marginBottom: 28, lineHeight: 20 }}>
          {subtitle}
        </Text>
        {children}
        <View style={{ flex: 1, minHeight: 24 }} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
