# Changelog

## 3.9.3 - 2026-08-26

### Fixed

- Clarified animal-energy questions so pupils are asked for the intended basic-needs category instead of an open-ended food example.
- Kept reviewed interactive stems consistent across the quiz, Tutor AI context, and saved learning sessions.
- Added regression gates for underdetermined food prompts and mismatched interactive question text.

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
