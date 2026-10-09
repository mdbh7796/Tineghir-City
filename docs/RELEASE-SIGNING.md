# Release signing (Play Store)

One-time keystore (do once, back up offline):

```bash
keytool -genkeypair -v -keystore tineghir-release.keystore -alias tineghir -keyalg RSA -keysize 2048 -validity 10000
```

CI / local release build (Windows):

```powershell
$env:TINEGHIR_KEYSTORE_PATH="C:\secure\tineghir-release.keystore"
$env:TINEGHIR_KEYSTORE_PASSWORD="***"
$env:TINEGHIR_KEY_ALIAS="tineghir"
$env:TINEGHIR_KEY_PASSWORD="***"
npm run android:build-release-win
```

Without env vars the `release` build fails closed (set `ALLOW_UNSIGNED_RELEASE=1`
only for CI debug artifacts — never for Play uploads). With Play App Signing,
Google manages the app-signing key; you keep the upload key (back up offline,
2 copies). Lost upload key? Reset it via Play Console → Setup → App signing.
Upload `android/app/build/outputs/bundle/release/app-release.aab` to Play Console.

Icons/splash regenerate:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#1c1917' --splashBackgroundColor '#1c1917'
npx cap sync android
```
