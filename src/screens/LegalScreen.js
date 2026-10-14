import { Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import { getPrivacyPolicy, getTerms } from '../legal/content';
import baseConfig from '../legal/config';
import features from '../features';
import { fonts, useTheme } from '../theme';

// Shows the Privacy Policy or the Terms of Service (route param: doc = 'privacy' | 'terms').
const config = { ...baseConfig, googleSignIn: features.googleSignIn };

export default function LegalScreen({ navigation, route }) {
  const t = useTheme();
  const doc = route.params?.doc === 'terms' ? getTerms(config) : getPrivacyPolicy(config);

  return (
    <AuthLayout onBack={() => navigation.goBack()} title={doc.title} subtitle={doc.updated}>
      {doc.sections.map((s) => (
        <View key={s.heading} style={{ marginBottom: 20 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 16, color: t.text, marginBottom: 8 }}>
            {s.heading}
          </Text>
          {s.body.map((line, i) =>
            line.startsWith('• ') ? (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted }}>•</Text>
                <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: t.text, lineHeight: 21 }}>
                  {line.slice(2)}
                </Text>
              </View>
            ) : (
              <Text key={i} style={{ fontFamily: fonts.regular, fontSize: 14, color: t.text, lineHeight: 21, marginBottom: 8 }}>
                {line}
              </Text>
            )
          )}
        </View>
      ))}
    </AuthLayout>
  );
}
