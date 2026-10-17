# Release signing (Play Store)

## Current upload key (generated 2026-10-17)

| Item | Value |
|---|---|
| Keystore | `~/.secure/tineghir-release.keystore` (RSA 4096, validity 10000 days) |
| Alias | `tineghir` |
| SHA-256 | `66:8C:24:D7:ED:18:9E:CF:0C:BE:A0:E2:95:DA:1E:AE:9E:F8:E2:69:60:F5:B9:C1:8D:13:72:85:7E:ED:45:A1` |
| Passwords + fingerprint | `~/.secure/tineghir-release.credentials` (chmod 600) |

**Back both files up offline, two copies, in separate locations.** With Play App
Signing enrolled, Google holds the *app-signing* key; you keep this as the
*upload* key. A lost upload key can be reset in Play Console → Setup → App
signing, but do not rely on that.

Generate a replacement (only if starting over — this changes the app identity):

```bash
keytool -genkeypair -v -keystore tineghir-release.keystore -alias tineghir \
  -keyalg RSA -keysize 4096 -validity 10000
keytool -list -v -keystore tineghir-release.keystore -alias tineghir   # record SHA-256
```

## CI secrets (already set on the repo)

The tag-release job decodes the keystore from base64 and signs with these four
repository secrets. Re-set them with:

```bash
gh secret set TINEGHIR_KEYSTORE_BASE64   -b "$(base64 -w0 ~/.secure/tineghir-release.keystore)"
gh secret set TINEGHIR_KEYSTORE_PASSWORD -b "$(grep '^storepass:' ~/.secure/tineghir-release.credentials | awk '{print $2}')"
gh secret set TINEGHIR_KEY_ALIAS         -b "tineghir"
gh secret set TINEGHIR_KEY_PASSWORD      -b "$(grep '^keypass:'   ~/.secure/tineghir-release.credentials | awk '{print $2}')"
```

## Local signed build

```bash
export TINEGHIR_KEYSTORE_PATH=~/.secure/tineghir-release.keystore
export TINEGHIR_KEYSTORE_PASSWORD=...   # see the credentials file
export TINEGHIR_KEY_ALIAS=tineghir
export TINEGHIR_KEY_PASSWORD=...
npm run android:bundle-release
# -> android/app/build/outputs/bundle/release/app-release.aab
```

Without the env vars the release build fails closed. Never commit `*.keystore`
(check `git status --short` before every release commit); the CI decode step
writes build scratch that is git-ignored.

## Icons / splash regenerate

```bash
npx @capacitor/assets generate --iconBackgroundColor '#1c1917' --splashBackgroundColor '#1c1917'
npx cap sync android
```
