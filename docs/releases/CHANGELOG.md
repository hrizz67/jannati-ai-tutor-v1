# Changelog

## 3.3.7 - 2026-08-20

### Mobile Nota and Buku Teks layout

- Changed learning-content cards to one column on phones, two columns on tablets, and three columns on desktop.
- Added safe text wrapping and minimum-width guards for topic cards, notes, textbook guidance, methods, and official references.
- Verified zero horizontal overflow at 390, 430, 600, 700, and 980 pixel viewports without modifying learning content data.

### Supabase migration baseline

- Added Supabase CLI configuration, declarative schema files, and ordered migrations for the production database.
- Added repeatable migration commands for schema pull, history inspection, dry-run review, and controlled production push.
- Preserved Free-by-default account creation, profile ownership boundaries, and explicit RPC permissions in the migration source.

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
