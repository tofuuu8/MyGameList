import { Text } from 'react-native';
import { fonts, useTheme } from '../theme';

// "By continuing, you agree to our Terms of Service and Privacy Policy."
export default function LegalNote({ navigation, prefix = 'By continuing, you agree to our' }) {
  const t = useTheme();
  const link = { fontFamily: fonts.bold, color: t.link };
  return (
    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 18, marginTop: 14 }}>
      {prefix}{' '}
      <Text accessibilityRole="link" onPress={() => navigation.navigate('Legal', { doc: 'terms' })} style={link}>
        Terms of Service
      </Text>
      {' and '}
      <Text accessibilityRole="link" onPress={() => navigation.navigate('Legal', { doc: 'privacy' })} style={link}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
