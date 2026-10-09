# Play Data Safety — exact form answers (must match AndroidManifest.xml)

Permissions declared (`android/app/src/main/AndroidManifest.xml:35-37`):
`INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`. No other
dangerous permissions. No ads SDK, no analytics SDK, no Firebase.

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **Yes — location only**: approximate + precise location |
| Purpose | App functionality (center map, sort nearby places) |
| On-device vs transmitted | Processed **on-device only**; never transmitted off the device, never shared with third parties, never sold |
| Ephemeral? | Yes — used for the live session, not stored server-side (nothing stored anywhere off-device) |
| Required or optional? | Optional — app works fully with permission denied (markers, offline maps, lists) |
| Other data types (contacts, photos, identifiers, browsing)? | None collected |
| Ads / analytics / data brokers? | None |

Keep this file in sync with the manifest: adding any permission or SDK
requires updating this table BEFORE the next release.
