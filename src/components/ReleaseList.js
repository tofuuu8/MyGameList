import { Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

const TAGS = { new: 'New', improved: 'Improved', fixed: 'Fixed' };

// Shows a list of releases with every change in each one.
export default function ReleaseList({ items }) {
  const t = useTheme();
  return (
    <View style={{ gap: 22 }}>
      {items.map((r) => (
        <View key={r.id}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>
            Version {r.id} · {r.date}
          </Text>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text, marginTop: 2, marginBottom: 10 }}>
            {r.title}
          </Text>
          {r.changes.map((c, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View
                style={{
                  alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, marginBottom: 4,
                  backgroundColor: c.type === 'new' ? t.red : 'transparent',
                  borderWidth: c.type === 'new' ? 0 : 1, borderColor: t.text,
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: c.type === 'new' ? t.onRed : t.text }}>
                  {TAGS[c.type] || 'Change'}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.text, lineHeight: 21 }}>{c.text}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
