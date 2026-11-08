# VitalVault

An offline, encrypted health and workout tracker for Android and desktop.

## 📱 Install on Android
1. On your phone, open **[the latest release](../../releases/latest)** and tap **VitalVault.apk**.
2. Open the downloaded file. If Android blocks it, tap **Settings → Allow from this source**, go back, and tap **Install**. If Play Protect warns you, tap **More details → Install anyway**.
3. Open VitalVault, create your passphrase, and allow notifications.

New versions install over the old one and keep your data.

## 🖥️ Try it on desktop
Download `VitalVault-desktop.html` and open it in Chrome or Edge.

## How the build works
- The whole app is `www/index.html`. Pushing to `main` makes GitHub Actions build a signed `VitalVault.apk` and publish it as a release.
- `signing.enc` is the app's signing key, **encrypted**. The build unlocks it with the repository secret `VV_SIGNING_SECRET`. The unencrypted key is never committed.
- Your health data never leaves your phone. It's stored encrypted with your passphrase, in the app's private storage.
