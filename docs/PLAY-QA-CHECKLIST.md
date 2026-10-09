# Pre-launch QA checklist (internal-testing build, human-gated)

Device matrix (minimum):
- [ ] Low-end 2GB RAM device, Android 9 (minSdk 24 path)
- [ ] Mid-range, Android 12–13 (runtime permission model)
- [ ] Current Pixel or equivalent, Android 15+ (edge-to-edge, predictive back)

Functional:
- [ ] Cold start <3s on mid-range; splash shows `#1c1917`, no white flash
- [ ] Airplane mode: app opens, offline maps render, markers + popups work, banner only when tiles truly missing
- [ ] Location denied: hint text shows, no crash; granted: map centers, sort-by-distance works
- [ ] `?place=todra-gorge` deep-link centers + opens popup
- [ ] Dark mode toggle persists across restart; respects system default on first run
- [ ] Back button: closes lightbox → closes drawer → goes back → exits only at root
- [ ] Rotation on map + gallery: no lost state, no clipped controls
- [ ] All 44px touch targets reachable; keyboard focus visible throughout
- [ ] Consent banner: shows once, Accept/Decline both dismiss and persist

Store/Policy:
- [ ] `store/` screenshots replaced with real captures (no DRAFT placeholders)
- [ ] Privacy page reachable in-app; URL matches listing + Data Safety form
- [ ] Listing copy proofread (EN; FR only if `listing-fr.md` TODO cleared)

Rollout gate:
- [ ] Play **pre-launch report** reviewed: zero crashes/ANRs, accessibility clean
- [ ] Promote internal → closed → production 20%, hold 48h on clean vitals, then 100%
