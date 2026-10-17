# Pre-launch QA checklist (internal-testing build, human-gated)

Build under test: `versionName`/`versionCode` — see `docs/PLAY-QA-RESULTS.md`.

Device matrix (minimum):

- [ ] Low-end 2 GB RAM device, Android 9 (minSdk 24 path)
- [ ] Mid-range, Android 12–13 (runtime permission model)
- [ ] Current Pixel or equivalent, Android 15+ (edge-to-edge, predictive back)

Functional:

- [ ] Cold start < 3s on mid-range; splash shows `#1c1917`, no white flash
- [ ] Airplane mode: app opens; markers + popups work; tile banner shown
      (offline map layer is dormant until `public/tiles.json` exists)
- [ ] Location denied: hint text shows, no crash; granted: map centres,
      sort-by-distance works
- [ ] `?place=todra-gorge` deep link centres + opens the popup
- [ ] Dark mode toggle persists across restart; respects system default on first run
- [ ] Back button: closes lightbox → closes drawer → goes back → exits only at root
- [ ] Rotation on map + gallery: no lost state, no clipped controls
- [ ] All 44px touch targets reachable; keyboard focus visible throughout
- [ ] Consent banner: shows once, Accept/Decline both dismiss and persist
- [ ] Support email link opens the mail client (`mdbh854@outlook.com`)

Store / policy:

- [ ] Screenshots in the listing match the shipped build (`assets/play/`)
- [ ] Privacy page reachable in-app; URL matches the listing + Data Safety form
- [ ] Listing copy proofread (EN; FR only once `docs/PLAY-LISTING-fr.md` is cleared)

Rollout gate:

- [ ] Play **pre-launch report** reviewed: zero crashes/ANRs, accessibility clean
- [ ] Promote internal → closed → production 20%, hold 48h on clean vitals, then 100%
