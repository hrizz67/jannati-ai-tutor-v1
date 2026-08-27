# Changelog

## 3.9.5 - 2026-08-27

### Fixed

- Reconcile a stale mobile-generated child ID with the canonical cloud child automatically during every authenticated account merge.
- Keep the richer XP and learning evidence when desktop and mobile submit the same learner under different historical child IDs.
- Allow the operating system to select the requested `ms-MY`, `en-GB`, or `ar-SA` voice when a mobile browser exposes an empty or incomplete voice list.

### Safety

- Automatic identity reconciliation remains disabled for guest payloads, so Free learning cannot be joined to a Premium account by display name alone.
- Explicitly installed English or Indonesian voices are never selected as a Malay replacement; the system receives the requested Malay locale instead.
- Voice failures now distinguish unsupported browsers, missing language packs, and general audio errors.

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
