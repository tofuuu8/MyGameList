import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Bottom tab icons (same shapes as the design).
export default function TabIcon({ name, color, size = 22 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color,
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'Library':
      return (
        <Svg {...p}>
          <Rect x="3" y="3" width="7" height="7" />
          <Rect x="14" y="3" width="7" height="7" />
          <Rect x="3" y="14" width="7" height="7" />
          <Rect x="14" y="14" width="7" height="7" />
        </Svg>
      );
    case 'Discover':
      return (
        <Svg {...p}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </Svg>
      );
    case 'Add':
      return (
        <Svg {...p}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v8M8 12h8" />
        </Svg>
      );
    case 'Stats':
      return (
        <Svg {...p}>
          <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </Svg>
      );
    default:
      return (
        <Svg {...p}>
          <Rect x="3" y="4" width="18" height="12" rx="2" />
          <Path d="M8 20h8M12 16v4" />
        </Svg>
      );
  }
}
