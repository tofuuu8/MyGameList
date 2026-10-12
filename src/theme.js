import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const palettes = {
  dark: {
    bg: '#0A0A0A', surface: '#161616', border: '#2C2C2C', tabBar: '#101010',
    text: '#FFFFFF', muted: '#A3A3A3',
    red: '#E5202E', link: '#FF4B55', onRed: '#FFFFFF', track: '#2C2C2C',
    badge: {
      playing: { bg: '#E5202E', fg: '#FFFFFF' },
      completed: { bg: '#FFFFFF', fg: '#0A0A0A' },
      want: { bg: '#2C2C2C', fg: '#E5E5E5' },
      notInstalled: { bg: '#262626', fg: '#A3A3A3' },
    },
  },
  light: {
    bg: '#FFFFFF', surface: '#F4F4F4', border: '#E2E2E2', tabBar: '#FAFAFA',
    text: '#0A0A0A', muted: '#5E5E5E',
    red: '#D91C29', link: '#D91C29', onRed: '#FFFFFF', track: '#E2E2E2',
    badge: {
      playing: { bg: '#D91C29', fg: '#FFFFFF' },
      completed: { bg: '#0A0A0A', fg: '#FFFFFF' },
      want: { bg: '#E8E8E8', fg: '#333333' },
      notInstalled: { bg: '#E6E6E6', fg: '#5E5E5E' },
    },
  },
};

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
};

export const TAGLINE = 'Your Games, Your Journey.';

const KEY = 'theme-preference';
const ThemeContext = createContext({
  pref: 'system', setPref: () => {}, palette: palettes.dark, isDark: true,
});

// Lets the user pick Light, Dark or System (saved on the phone).
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v); })
      .catch(() => {});
  }, []);

  const mode = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  const value = useMemo(
    () => ({
      pref,
      setPref: (v) => { setPrefState(v); AsyncStorage.setItem(KEY, v).catch(() => {}); },
      palette: palettes[mode],
      isDark: mode === 'dark',
    }),
    [pref, mode]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).palette;
export const useThemePreference = () => {
  const { pref, setPref, isDark } = useContext(ThemeContext);
  return { pref, setPref, isDark };
};
