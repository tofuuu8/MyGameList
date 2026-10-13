import { Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

const LABELS = { can: 'Can run', might: 'Might struggle', unknown: 'Unknown' };

export default function CompatBadge({ status }) {
  const t = useTheme();
  const style =
    status === 'can'
      ? { bg: 'transparent', fg: t.text, border: t.text }
      : status === 'might'
        ? { bg: t.badge.want.bg, fg: t.badge.want.fg, border: 'transparent' }
        : { bg: t.badge.notInstalled.bg, fg: t.badge.notInstalled.fg, border: 'transparent' };
  return (
    <View
      style={{
        backgroundColor: style.bg, borderColor: style.border, borderWidth: 1,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: style.fg }}>{LABELS[status]}</Text>
    </View>
  );
}
