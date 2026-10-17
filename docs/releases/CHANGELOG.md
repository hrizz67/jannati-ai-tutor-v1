# Changelog

## 3.13.28 - 2026-10-17

### Consolidated changes

- Added 30 teacher-reviewed interactive overlays from P1.16C Batches 2–6 without changing source question contracts or the 4,530-question bank.
- Preserved 292 authored, 985 derived auto-safe, and 1,277 runtime-interactive questions, with zero mobile-unsafe and per-question accessibility-risk findings.
- Deferred communication content and retained explicit user recovery for failed dynamic imports through P1.16D.
- Hardened post-answer accessibility and rendered interaction/recovery behavior through P1.16E.
- Added the isolated, CI-only P1.16F QA preview artifact while keeping QA mode and disabled-backend preview configuration out of production builds.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.
- Production uses the normal Vite production mode; the child-safety generative AI gateway remains disabled.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Physical iPhone, Android, VoiceOver, TalkBack, and R3A/R3B acceptance remain NOT RUN / ON HOLD.
- If rollback is required, redeploy immutable tag `v3.13.27` (commit `220fe3bd85b47d0f816b8d56659a05ee9f74ead1`); the pre-release Pages reference is `0b5db4d19e36e71a15ad0b7f05cfae993af0266e`.
