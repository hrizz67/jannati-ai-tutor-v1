# Changelog

## 3.9.4 - 2026-08-27

### Fixed

- Reject and quarantine explicitly mismatched account or child learning snapshots before they can enter the active profile projection.
- Prevent stale guest, free-account, or wrong-child data from replacing newer Premium learning progress during cloud hydration, conflict recovery, or retry.
- Route listening playback and legacy read-aloud helpers through one speech owner so repeated actions cannot create overlapping browser speech.

### Added

- Add a multilingual BM, English, and Arabic voice engine with strict same-language voice selection, delayed mobile voice loading, mixed Arabic/Rumi sequencing, replay, pause, resume, status, and controlled result codes.
- Add regression coverage for learning-data ownership, invalid voice fallback, language priority, mixed-language speech, delayed `voiceschanged`, and non-overlapping queued playback.

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
