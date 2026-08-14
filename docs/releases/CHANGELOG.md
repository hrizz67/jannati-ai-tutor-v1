# Changelog

## 3.3.5 - 2026-08-14

### Multi-device sync hotfix

- Replaced the render-owned Cloud debounce timer with a persistent timer and explicitly scheduled a Cloud save after each checked quiz answer.
- Reduced visible-device Cloud polling from 15 seconds to five seconds while preserving focus, visibility, and reconnect refreshes.
- Added clear local-only, syncing, saved, loaded, offline, and failed states to the dashboard and quiz UI.
- Preserved anonymous learning during sign-in and merged meaningful local progress into both first-time and returning account snapshots before hydration.
- Added regression gates for answer-triggered sync, migration safety, account login preservation, status disclosure, and prompt cross-device refresh.

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
