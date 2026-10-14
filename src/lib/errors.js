// Turns technical error messages into short, friendly ones.
export function friendlyError(err) {
  const msg = String((err && err.message) || err || '');
  if (/network request failed|failed to fetch|network error|fetch failed|timed out|timeout/i.test(msg)) {
    return 'No internet connection. Check your connection and try again.';
  }
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/already registered|already been registered/i.test(msg)) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (/rate limit|too many requests|for security purposes/i.test(msg)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (/should be different from the old/i.test(msg)) return 'Your new password must be different from the old one.';
  if (/password should be at least/i.test(msg)) return 'That password is too short.';
  if (/non-2xx/i.test(msg)) return 'Something went wrong on our side. Please try again in a moment.';
  return msg || 'Something went wrong. Please try again.';
}
