# Changelog

## 3.9.7 - 2026-08-28

### Question bank quality

- Repaired 128 high-confidence semantic ambiguities across English, Science, and Arabic while preserving canonical answers and question identifiers.
- Repaired 246 weak distractors across 82 objective questions and removed the remaining answer-position bias patterns.
- Aligned 1598 difficulty labels and 1503 cognitive-demand labels with the actual work required from pupils.
- Added deterministic option ordering and dedicated semantic-uniqueness and distractor-difficulty release gates.
- Removed three misleading KBAT labels from direct-identification Bahasa Melayu questions instead of inflating their cognitive level.

### Safety

- Question count remains 4530 across 8 subjects and 84 topics.
- Scoring, adaptive/mastery behaviour, question IDs, and learner progress data are unchanged.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14814 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
