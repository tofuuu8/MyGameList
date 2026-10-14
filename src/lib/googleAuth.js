import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Reads values from both the "?query" and the "#fragment" parts of the returned address.
function parseParams(url) {
  const params = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] || '';
  [query, hash].forEach((part) => {
    part.split('&').forEach((pair) => {
      if (!pair) return;
      const i = pair.indexOf('=');
      const key = decodeURIComponent(i === -1 ? pair : pair.slice(0, i));
      const value = i === -1 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
      params[key] = value;
    });
  });
  return params;
}

// Opens Google's sign-in page and signs the user in when they come back.
// On success, the app's sign-in listener opens the main screens automatically.
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return; // the page goes to Google and comes back signed in
  }

  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return; // the user closed the window

  const params = parseParams(result.url);
  if (params.error_description || params.error) {
    throw new Error(params.error_description || params.error);
  }
  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
  } else if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
  } else {
    throw new Error('Google sign-in did not finish. Please try again.');
  }
}
