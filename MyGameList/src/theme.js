import { useColorScheme } from 'react-native';

export const palettes = {
  dark: {
    bg: '#0A0A0A', surface: '#161616', border: '#2C2C2C',
    text: '#FFFFFF', muted: '#A3A3A3',
    red: '#E5202E', link: '#FF4B55', onRed: '#FFFFFF', track: '#2C2C2C',
  },
  light: {
    bg: '#FFFFFF', surface: '#F4F4F4', border: '#E2E2E2',
    text: '#0A0A0A', muted: '#5E5E5E',
    red: '#D91C29', link: '#D91C29', onRed: '#FFFFFF', track: '#E2E2E2',
  },
};

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
};

export const TAGLINE = 'Your Games, Your Journey.';

// Follows the phone's light/dark setting (dark if it can't tell).
export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'light' ? palettes.light : palettes.dark;
}
