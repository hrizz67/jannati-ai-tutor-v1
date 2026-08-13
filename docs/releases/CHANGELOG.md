# Changelog

## 3.3.2 - 2026-08-13

### Fixed

- Isolated resume state by mode, subject and topic, including subject-specific Pentaksiran Sumatif sessions.
- Repaired the Sambung action and preserved the original question order when resuming.
- Improved semantic line wrapping for question prompts and clarified ambiguous Bahasa Melayu items.
- Constrained automatic Bahasa Melayu person-role repair to valid person names and roles.

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
