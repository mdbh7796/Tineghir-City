# Tineghir City Website

## Description
A static tourism and cultural website dedicated to Tineghir, a stunning oasis city in eastern Morocco. It serves as a digital gateway for travelers and locals alike to explore the region's unique heritage and natural wonders.

## What is this website about?
The website is designed to promote Tineghir as a premier travel destination by highlighting:
*   **Natural Wonders:** Detailed information on the iconic Todra Gorge and the lush palm groves (Palmerie).
*   **Cultural Heritage:** Insights into the traditional Berber architecture, crafts, and the local way of life.
*   **Travel Planning:** A showcase of attractions and experiences to help visitors plan their trip to the region.
*   **Modern Interface:** A responsive, user-friendly design built with Tailwind CSS to ensure a seamless experience across all devices.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mdbh7796/Tineghir-City.git
   cd Tineghir-City
   ```

2. **Install dependencies (for Tailwind CSS only):**
   ```bash
   npm install
   ```

3. **Build the CSS:**
   ```bash
   npm run build
   ```

## Usage

*   **View the Website:** Open `public/index.html` in any modern web browser, or serve the `public/` folder with any static file server.
*   **Development:** Use `npm run watch` to automatically compile Tailwind styles during development.

## Deployment

This is a static website. Simply deploy the `public/` folder to any static hosting service:
*   GitHub Pages
*   Netlify
*   Vercel
*   Any web server

## Android app (Capacitor)

The site is wrapped as a native Android app with [Capacitor](https://capacitorjs.com/):
*   App ID: `com.tineghir.city`, name: `Tineghir City`
*   Web assets: `public/` (built via `npm run build`), config: `capacitor.config.ts`
*   Native project: `android/` (committed, build outputs ignored)

Prerequisites for local builds: Node 22+, Java 21, Android SDK
(`cmdline-tools`, `platforms;android-36`, `build-tools;36.0.0`),
`ANDROID_HOME` set, licenses accepted (`sdkmanager --licenses`).

```bash
npm install
npm run android:sync          # build Tailwind + copy public/ into android/
npm run android:build-debug   # macOS/Linux -> android/app/build/outputs/apk/debug/app-debug.apk
npm run android:build-debug-win   # Windows -> same APK via gradlew.bat
```

No SDK installed? Push to `main` (or run the workflow manually) and grab the
debug APK from the **Android debug APK (Capacitor)** GitHub Actions artifacts.

The website itself deploys free via GitHub Pages (`pages.yml`): enable
Pages in repo Settings → Pages → Source "GitHub Actions" once, then every
push to `main` publishes `public/`.

## Release (signed APK, free distribution)

Debug APKs install fine, but Android only auto-updates apps signed with the
same key. One-time setup (on your machine, never committed):

```bash
keytool -genkeypair -alias tineghir -keyalg RSA -keysize 4096 \
  -validity 10000 -keystore ~/.secure/tineghir-release.keystore
```

Back up the keystore + passwords offline ×2 — losing it breaks updates.
Then repo Settings → Secrets → Actions, add `TINEGHIR_KEYSTORE_BASE64`
(base64 of the keystore), `TINEGHIR_KEYSTORE_PASSWORD`, `TINEGHIR_KEY_ALIAS`,
`TINEGHIR_KEY_PASSWORD`.

To ship: bump `version` in `package.json`, commit, then

```bash
git tag v1.0.0 && git push origin v1.0.0
```

CI stamps the version, builds a signed release APK, verifies it with
`apksigner`, and attaches it to the GitHub Release. Share that APK link —
it installs and updates cleanly on any phone.

To customize the launcher icon/splash, run
`npx @capacitor/assets generate` with your source icon.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. **Never edit `public/` directly** — `src/` is canonical (`src/templates/` → `public/*.html`, `src/js/` → `public/script.js`, `src/sw.js` → `public/sw.js`). Run `npm run build` and commit both.
4. Verify: `npm run check` and `npm run check:drift` must pass.
5. Make your changes and commit: `git commit -m 'Add some feature'`.
6. Push to the branch: `git push origin feature-name`.
7. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
