# Play Data Safety — exact form answers (must match AndroidManifest.xml)

Permissions declared (`android/app/src/main/AndroidManifest.xml:35-37`):
`INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`. No other
dangerous permissions. No ads SDK, no analytics SDK, no Firebase.

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **No collection.** Location (approximate + precise) is processed **on-device only** for map centering and nearby sorting — never transmitted to us or any third party, never stored off-device by the app |
| Platform-level exceptions (disclosed in privacy policy) | Loading online map tiles makes standard network requests (IP visible to tile server); Android auto-backup may copy on-device storage to the user’s own Google account if enabled |
| Other data types (contacts, photos, identifiers, browsing)? | None collected |
| Ads / analytics / data brokers? | None |
| Required or optional? | Optional — markers, offline maps, lists, planner all work with permission denied |
| In-app disclosure | `strings.xml` `location_rationale_*` reserves the native prompt context; web flow explains on-device use in the permission-denied hint and this privacy page |

Keep this file in sync with the manifest: adding any permission or SDK
requires updating this table BEFORE the next release.
