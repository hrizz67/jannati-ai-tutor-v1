# Changelog

## 3.3.4 - 2026-08-14

### Multi-device learning sync

- Gated account autosave until the first cloud hydration completes, preventing stale device state from replacing newer cloud learning data at sign-in.
- Added per-child snapshot merging, dirty-profile tracking, deletion tombstones, and persistent offline retry markers so separate child profiles remain isolated across desktop and mobile.
- Refreshed the active child snapshot before each upload and applied completed uploads without restoring stale in-flight answers over newer local work.
- Distinguished empty cloud state from network/RPC failures and prevented an initial failed pull from turning unchanged device data into an upload.
- Added regression coverage for multi-device changes, profile isolation, offline retry, clock skew, deletion safety, and account-scoped cloud access.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
