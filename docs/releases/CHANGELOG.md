# Changelog

## 3.9.6 - 2026-08-27

### Fixed

- Converge every redundant XP projection in a child snapshot on the highest valid global XP during cloud hydration.
- Prevent a stale adaptive, gamification, AI-memory, or student-core cache from hiding richer learning progress on another device at the same cloud revision.
- Repair imported cloud learning data across all XP stores before the dashboard renders the active child.

### Safety

- XP reconciliation is monotonic and never adds duplicated projections, so repeated sync cannot multiply rewards.
- Reconciliation remains contained within the active child snapshot and preserves existing account and child ownership checks.
- Added regression fixtures for the real mismatch case where cloud profile XP is higher than the mobile adaptive cache.

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
