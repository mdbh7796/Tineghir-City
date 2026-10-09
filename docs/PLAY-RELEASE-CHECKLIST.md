# Play release checklist (internal track first)

Prerequisites (one-time):
- [ ] Play Console developer account ($25), app `com.tineghir.city` created
- [ ] Play App Signing enrolled; upload key generated (`docs/RELEASE-SIGNING.md`), backed up offline ×2
- [ ] CI secrets set: `TINEGHIR_KEYSTORE_BASE64/PASSWORD/KEY_ALIAS/KEY_PASSWORD`
- [ ] Contact email live: support@tineghir.ma (listing + privacy page agree)
- [ ] Privacy policy published: https://www.tineghir.ma/privacy.html
- [ ] Data Safety form filled per `docs/PLAY-DATA-SAFETY.md`; content rating done per `docs/PLAY-CONTENT-RATING.md`; store listing uploaded from `store/`

Release (every version):
1. Bump `package.json` version, commit.
2. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z` — CI `release` job builds the
   strict signed AAB (offline maps mandatory, `apksigner verify` must pass).
3. Download versioned AAB artifact `tineghir-release-vX.Y.Z`.
4. Play Console → Testing → **Internal testing** → upload AAB → add testers
   (email list) → share testing link.
5. Complete `docs/PLAY-QA-RESULTS.md` on the internal build (Task 7).
6. Review the **pre-launch report** (crashes, screenshots, accessibility).
7. Fix issues → new version → repeat. Only then promote: internal → closed →
   production at 20%, hold 48h on clean vitals, then 100%.
