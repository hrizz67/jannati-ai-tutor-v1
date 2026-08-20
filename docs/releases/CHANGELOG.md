# Changelog

## 3.4.1 - 2026-08-20

### Premium child-profile recovery

- Reused the existing Premium child profile when an anonymous/local profile has the same normalized learner name and school year during account-login migration.
- Prevented a newer empty local snapshot from hiding a richer Premium learning snapshot.
- Repaired the legacy corrupted state where an empty duplicate profile was active while the original Premium profile still held the learner's progress.
- Realigned the active child ID, child metadata, snapshots, and current learning state after reconciliation.

### Profile isolation safeguards

- Restricted name-and-year reconciliation to the explicit login-recovery path; normal multi-device sync continues to use stable child IDs.
- Kept same-name profiles in different school years separate.
- Preserved the Premium profile as the canonical record and removed only the reconciled anonymous alias.
- Added regression coverage for Premium profile reuse, existing cloud duplicates, snapshot evidence priority, and multi-profile isolation.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Learning-sync, resume-isolation, access-control, and profile-reconciliation regressions passed.
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
