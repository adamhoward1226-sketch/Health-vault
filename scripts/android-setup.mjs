// Run after `npx cap add android`. Adds notification permissions,
// a notification icon and a VitalVault launcher icon. Safe to run repeatedly.
import fs from 'node:fs';
import path from 'node:path';

const res = 'android/app/src/main/res';
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifestPath)) {
  console.error('Android project not found. Run `npx cap add android` first.');
  process.exit(1);
}

// 1. Permissions for scheduled daily notifications
let m = fs.readFileSync(manifestPath, 'utf8');
const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK',
];
for (const p of perms) {
  if (!m.includes(`"${p}"`)) {
    m = m.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
  }
}
fs.writeFileSync(manifestPath, m);

const write = (rel, content) => {
  const f = path.join(res, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};

// 2. Small white notification icon (shield + heart)
write('drawable/ic_stat_vv.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF"
      android:pathData="M12,2L20,5V11.5C20,16.6 16.6,20.9 12,22C7.4,20.9 4,16.6 4,11.5V5L12,2ZM12,16.4L15.6,12.9C16.6,11.9 16.6,10.3 15.6,9.4C14.7,8.5 13.2,8.5 12.3,9.4L12,9.7L11.7,9.4C10.8,8.5 9.3,8.5 8.4,9.4C7.4,10.3 7.4,11.9 8.4,12.9L12,16.4Z"/>
</vector>
`);

// 3. Adaptive launcher icon (Android 8+): blue gradient background + white shield
write('drawable/vv_launcher_bg.xml', `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
  <gradient android:angle="315" android:startColor="#FF0D2466" android:centerColor="#FF1D47D6" android:endColor="#FF4A85FF" android:type="linear"/>
</shape>
`);
write('drawable/vv_launcher_fg.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <group android:translateX="30" android:translateY="30">
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M24,4L40,10V23C40,33.2 33.2,41.8 24,44C14.8,41.8 8,33.2 8,23V10L24,4ZM24,32.8L31.2,25.8C33.2,23.8 33.2,20.6 31.2,18.8C29.4,17 26.4,17 24.6,18.8L24,19.4L23.4,18.8C21.6,17 18.6,17 16.8,18.8C14.8,20.6 14.8,23.8 16.8,25.8L24,32.8Z"/>
  </group>
</vector>
`);
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@drawable/vv_launcher_bg"/>
  <foreground android:drawable="@drawable/vv_launcher_fg"/>
  <monochrome android:drawable="@drawable/vv_launcher_fg"/>
</adaptive-icon>
`;
write('mipmap-anydpi-v26/ic_launcher.xml', adaptive);
write('mipmap-anydpi-v26/ic_launcher_round.xml', adaptive);

// 4. Permanent signing key + auto-increasing version (so updates install over the old app, keeping your data)
const gradlePath = 'android/app/build.gradle';
let g = fs.readFileSync(gradlePath, 'utf8');
if (!g.includes('// VV-SIGNING')) {
  g = g.replace("apply plugin: 'com.android.application'\n", `apply plugin: 'com.android.application'

// VV-SIGNING
def vvProps = new Properties()
def vvPropsFile = rootProject.file('../keystore.properties')
if (vvPropsFile.exists()) { vvPropsFile.withInputStream { vvProps.load(it) } }
def vvKeystore = rootProject.file('../vitalvault.keystore')
def vvVersionCode = ((System.currentTimeMillis() - 1767225600000L) / 60000L).toInteger()
def vvVersionName = "1." + new Date().format('yyyy.MMdd.HHmm')
`);
  g = g.replace('    defaultConfig {', `    signingConfigs {
        vitalvault {
            if (vvKeystore.exists()) {
                storeFile vvKeystore
                storePassword vvProps.getProperty('storePassword')
                keyAlias vvProps.getProperty('keyAlias', 'vitalvault')
                keyPassword vvProps.getProperty('keyPassword')
            }
        }
    }
    defaultConfig {`);
  g = g.replace(/versionCode \d+/, 'versionCode vvVersionCode').replace(/versionName "[^"]*"/, 'versionName vvVersionName');
  g = g.replace('        release {\n', `        debug {
            if (vvKeystore.exists()) signingConfig signingConfigs.vitalvault
        }
        release {
            if (vvKeystore.exists()) signingConfig signingConfigs.vitalvault
`);
  fs.writeFileSync(gradlePath, g);
}
if (!fs.existsSync('vitalvault.keystore')) console.warn('⚠ vitalvault.keystore not found — the release APK will be unsigned.');

console.log('✓ VitalVault Android setup complete (notifications, icons, signing, versioning).');
