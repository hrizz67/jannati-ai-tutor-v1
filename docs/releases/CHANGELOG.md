# Changelog

## 3.4.2 - 2026-08-20

### Duplicate child-profile consolidation

- Consolidated same-name and same-year child profiles created by the legacy logout/login migration bug, even when both profiles already contain learning data.
- Kept the oldest established Premium child ID as the canonical profile and realigned the active child to that ID.
- Merged distinct topic progress, learning history, achievements, memory, and resume slots conservatively instead of discarding either profile's learning.
- Used maximum values for cumulative counters such as XP and scores to avoid double counting overlapping data.

### Recovery and multi-device safeguards

- Stored the removed duplicate snapshot in a hidden account-scoped recovery backup before consolidation.
- Added a deletion tombstone for the duplicate ID so an older desktop or mobile device cannot resurrect it during the next sync.
- Prevented recovery backups from being copied recursively into child snapshots.
- Reused an existing profile when a user attempts to create the same learner name and school year again.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Duplicate-profile data consolidation, backup, tombstone, profile-isolation, and multi-device sync regressions passed.
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
