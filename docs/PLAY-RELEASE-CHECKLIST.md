# Play release checklist (internal track first)

App: `com.tineghir.city` · "Tineghir City" · Category: Travel & Local · Free, no ads, no in-app purchases.

## One-time setup

- [ ] Play Console developer account created ($25); app `com.tineghir.city` created
- [x] Play App Signing enrolled; upload key generated and CI secrets set (`docs/RELEASE-SIGNING.md`)
- [ ] Upload key + credentials backed up offline, two copies
- [x] Contact email live: `mdbh854@outlook.com` (footer, contact page, privacy page, listing)
- [x] Privacy policy published: https://mdbh7796.github.io/Tineghir-City/privacy.html
- [ ] Data Safety form completed per `docs/PLAY-DATA-SAFETY.md`
- [ ] Content rating questionnaire completed per `docs/PLAY-CONTENT-RATING.md`
- [ ] Store listing uploaded from `docs/PLAY-LISTING-en.md` + `assets/play/`

## Store assets (generated — `npm run play:graphics`)

| Asset | Path | Requirement |
|---|---|---|
| App icon | `assets/play/icon-512.png` | 512×512 |
| Feature graphic | `assets/play/feature-graphic-1024x500.png` | 1024×500, no alpha |
| Phone screenshots | `assets/play/screenshots/phone-*.png` | 1080×1920, ≥2 (6 supplied) |

## Every release

1. Bump `version` in `package.json` (this becomes `versionName`) and commit.
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
   - The CI `release` job builds a signed APK + AAB, verifies both signatures,
     and attaches them to the GitHub Release `vX.Y.Z`.
   - `versionCode` is stamped as `1 + count of v* tags` — never reuse a code.
3. Download `app-release.aab` from the GitHub Release.
4. Play Console → Testing → **Internal testing** → upload the AAB → add tester
   emails → share the testing link.
5. Complete `docs/PLAY-QA-RESULTS.md` on the internal build.
6. Review the **pre-launch report** (crashes, ANRs, screenshots, accessibility).
7. Promote: internal → closed → production 20%, hold 48h on clean vitals, then 100%.

> New **personal** developer accounts must first run **closed testing with 12
> testers for 14 continuous days** before they can apply for production access.

## Offline maps

The offline tile layer is **dormant until `public/tiles.json` exists**
(`docs/tiles.md`). Releases ship fine without it — the online OSM layer is
always present. Re-enabling offline maps requires committing the manifest, which
bundles the verified archive into the next release.
