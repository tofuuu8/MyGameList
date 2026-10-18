// Adds the build settings for a smaller app and a themed icon to YOUR app.json,
// without touching anything else in it (your Expo project ID, update settings, and so on).
//
// Usage:   node scripts/prepare-release.js 1.2.0
//          node scripts/prepare-release.js 1.2.0 YOUR-EXPO-PROJECT-ID   (only if app.json lost its project ID)
//
// It is safe to run more than once.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app.json');
const version = process.argv[2];
const projectIdArg = process.argv[3];

const config = JSON.parse(fs.readFileSync(file, 'utf8'));
const expo = config.expo || (config.expo = {});
const changes = [];

// 1) New version number (a new phone-level build needs a new version for updates to match it).
if (version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('The version should look like 1.1.0');
    process.exit(1);
  }
  if (expo.version !== version) {
    changes.push(`version: ${expo.version} -> ${version}`);
    expo.version = version;
  }
}

// 2) Settings that let the installed app receive updates. Without runtimeVersion, expo.dev shows
//    "Runtime: None" for the build and that app can never receive an update.
if (!expo.runtimeVersion) {
  expo.runtimeVersion = { policy: 'appVersion' };
  changes.push('added runtimeVersion (so the app can receive updates)');
}
expo.extra = expo.extra || {};
expo.extra.eas = expo.extra.eas || {};
if (!expo.extra.eas.projectId && projectIdArg) {
  expo.extra.eas.projectId = projectIdArg;
  changes.push('added your Expo project ID');
}
if (expo.extra.eas.projectId && !(expo.updates && expo.updates.url)) {
  expo.updates = { ...(expo.updates || {}), url: `https://u.expo.dev/${expo.extra.eas.projectId}` };
  changes.push('added the update address');
}

// 3) Smaller app: build only for ARM phones (every real Android phone), not for PC emulators.
//    Both 32-bit and 64-bit ARM are kept, because some budget phones run 32-bit Android.
expo.plugins = expo.plugins || [];
const ARCHS = ['armeabi-v7a', 'arm64-v8a'];
const existing = expo.plugins.findIndex((p) => (Array.isArray(p) ? p[0] : p) === 'expo-build-properties');
if (existing === -1) {
  expo.plugins.push(['expo-build-properties', { android: { buildArchs: ARCHS } }]);
  changes.push('added the expo-build-properties plugin (ARM only)');
} else {
  const entry = Array.isArray(expo.plugins[existing]) ? expo.plugins[existing] : [expo.plugins[existing], {}];
  entry[1] = entry[1] || {};
  entry[1].android = entry[1].android || {};
  if (JSON.stringify(entry[1].android.buildArchs) !== JSON.stringify(ARCHS)) {
    entry[1].android.buildArchs = ARCHS;
    changes.push('set the app to build for ARM phones only');
  }
  expo.plugins[existing] = entry;
}

// 4) Themed icon for Android 13 and newer.
expo.android = expo.android || {};
expo.android.adaptiveIcon = expo.android.adaptiveIcon || {};
if (expo.android.adaptiveIcon.monochromeImage !== './assets/monochrome-icon.png') {
  expo.android.adaptiveIcon.monochromeImage = './assets/monochrome-icon.png';
  changes.push('added the themed (single-color) icon');
}

if (changes.length === 0) {
  console.log('app.json already has everything. Nothing changed.');
} else {
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  console.log('Updated app.json:');
  changes.forEach((c) => console.log('  - ' + c));
}
