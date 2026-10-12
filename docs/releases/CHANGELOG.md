# Changelog

## 3.13.24 - 2026-10-12

### Mobile UX

- Gave plain-text mobile answer choices the full available text width without the old reserved 86px visual lane.
- Added compact text-safe typography for long learner-status values while keeping numeric KPIs centered and distinct.

### Analytics consistency

- Sourced subject performance from canonical progress evidence.
- Propagated real recorded learning time into subject and global analytics without fabricated or duplicate time.
- Labelled cross-subject AI recommendations explicitly so the target is distinct from the selected analytics subject.

### Scope boundaries

- Question wording, answers, IDs, and the 4,530-question bank remain unchanged.
- No P1.13 sync, reward, XP, coin, Supabase, database, schema, RPC, migration, auth, Premium, payment, STT, voice, Admin, or Parent business-logic behavior changed.
- No dependency was added.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
