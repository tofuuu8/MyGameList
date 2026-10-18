// Checks that the project is ready to be built into an app that can receive updates.
// Usage:   node scripts/check-release.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const results = [];
const check = (ok, good, bad) => results.push({ ok, text: ok ? good : bad });

let app;
let eas;
let pkg;
try {
  app = read('app.json').expo;
  eas = read('eas.json');
  pkg = read('package.json');
} catch (e) {
  console.error('Could not read app.json, eas.json or package.json:', e.message);
  process.exit(1);
}

const version = app.version;
check(/^\d+\.\d+\.\d+$/.test(version || ''), `App version is ${version}`, 'app.json has no version like 1.2.0');

check(!!app.runtimeVersion, `runtimeVersion is set (${JSON.stringify(app.runtimeVersion)}). The build will say Runtime: ${version}`,
  'runtimeVersion is MISSING. The build would show "Runtime: None" and could never receive updates. Run: node scripts/prepare-release.js ' + (version || '1.2.0'));
const projectId = app.extra && app.extra.eas && app.extra.eas.projectId;
check(!!projectId, `Expo project ID is set (${projectId})`, 'Expo project ID is MISSING. Run: eas init   (or: node scripts/prepare-release.js ' + (version || '1.2.0') + ' YOUR-PROJECT-ID)');
check(!!(app.updates && app.updates.url) && (!projectId || app.updates.url.includes(projectId)), 'Update address is set',
  'The update address (updates.url) is MISSING or wrong. Run: node scripts/prepare-release.js ' + (version || '1.2.0'));

// The profile you build with: "release" if you have it, otherwise "preview".
const profileName = eas.build && eas.build.release ? 'release' : 'preview';
const preview = eas.build && eas.build[profileName];
check(!!preview && preview.channel === 'preview', `eas.json "${profileName}" profile uses the "preview" channel`,
  `eas.json: the "${profileName}" profile has no "channel": "preview". Updates are sent to that channel, so the app would never get them.`);
check(!!preview && preview.android && preview.android.buildType === 'apk', `eas.json "${profileName}" builds an APK`, `eas.json: the "${profileName}" profile should have "android": { "buildType": "apk" }`);
check(!!preview && preview.environment === 'preview', `eas.json "${profileName}" uses the "preview" settings (your Supabase values)`,
  `eas.json: the "${profileName}" profile should have "environment": "preview", or the app is built without your Supabase settings.`);

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
['expo-updates', 'expo-build-properties', 'expo-file-system', 'expo-sharing', 'expo-document-picker', 'expo-constants'].forEach((d) =>
  check(!!deps[d], `${d} is installed`, `${d} is NOT installed. Run: npx expo install ${d}`));

const arch = (app.plugins || []).find((p) => Array.isArray(p) && p[0] === 'expo-build-properties');
check(!!arch, 'Smaller-app setting (ARM only) is on', 'The smaller-app setting is missing. Run: node scripts/prepare-release.js ' + (version || '1.2.0'));
check(!!(app.android && app.android.adaptiveIcon && app.android.adaptiveIcon.monochromeImage), 'Themed icon is set', 'The themed icon is missing. Run: node scripts/prepare-release.js ' + (version || '1.2.0'));
check(fs.existsSync(path.join(root, 'assets', 'monochrome-icon.png')), 'assets/monochrome-icon.png exists', 'assets/monochrome-icon.png is missing (copy it from the zip).');

console.log('');
results.forEach((r) => console.log(`${r.ok ? '  OK    ' : '  FIX   '}${r.text}`));
const bad = results.filter((r) => !r.ok).length;
console.log('');
if (bad === 0) {
  console.log(`All good. Build now: eas build --platform android --profile ${profileName}`);
  console.log(`After the build, expo.dev should show Runtime ${version} and Channel preview for it.`);
} else {
  console.log(`${bad} thing${bad === 1 ? '' : 's'} to fix before building. Fix them, then run this check again.`);
  process.exit(1);
}
