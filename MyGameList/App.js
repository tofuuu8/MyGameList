import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenNative from 'expo-splash-screen';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { palettes, useTheme } from './src/theme';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LibraryScreen from './src/screens/LibraryScreen';

// Keep the native splash up until fonts are ready.
SplashScreenNative.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const MIN_SPLASH_MS = 1800;

function Root() {
  const t = useTheme();
  const { session, loading } = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinTimeDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  const isDark = t === palettes.dark;
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: { ...(isDark ? DarkTheme : DefaultTheme).colors, background: t.bg, card: t.bg, text: t.text, border: t.border, primary: t.red },
  };

  if (loading || !minTimeDone) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Library" component={LibraryScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreenNative.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
