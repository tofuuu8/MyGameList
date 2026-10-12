import { Text } from 'react-native';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, useTheme } from '../theme';

const BODY =
  'M22 8H74C86 8 94 20 92 36L89 50C88 58 80 60 75 55L68 46H28L21 55C16 60 8 58 7 50L4 36C2 20 10 8 22 8Z';

// The controller + checkmark mark. `detail` is the d-pad and checkmark color.
export function LogoMark({ width = 96, body, detail }) {
  return (
    <Svg
      width={width}
      height={(width * 64) / 96}
      viewBox="0 0 96 64"
      accessibilityLabel="MyGameList logo"
    >
      <Path d={BODY} fill={body} />
      <Path d="M23 20h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill={detail} />
      <Path
        d="M62 30l6 6 12-13"
        fill="none"
        stroke={detail}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Red rounded tile with the white controller (same as the installed app icon).
export function AppIconTile({ size = 72 }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: t.red,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LogoMark width={size * 0.62} body="#FFFFFF" detail={t.red} />
    </View>
  );
}

export function Wordmark({ size = 38 }) {
  const t = useTheme();
  return (
    <Text
      style={{ fontFamily: fonts.bold, fontSize: size, letterSpacing: -size * 0.03 }}
      accessibilityRole="header"
    >
      <Text style={{ color: t.red }}>My</Text>
      <Text style={{ color: t.text }}>GameList</Text>
    </Text>
  );
}
