# Changelog

## 3.13.29 - 2026-10-18

### P1.17-V01

- Added an opt-in quiz mobile MediaRecorder-to-STT pilot implementation for future controlled iPhone Safari and Android Chrome validation.
- Added lifecycle regression coverage for fresh recording sessions, navigation cancellation, stale transcript containment, and explicit transcript review without automatic grading.
- Added a fail-closed production build permit. The public query parameter alone cannot activate quiz recording or upload quiz audio in the official production build.
- Kept the existing Bacaan/Bertutur path, Worker configuration, authentication, rewards, sync, Premium access, and question bank unchanged.

### Release safety

- Public quiz-pilot activation remains disabled pending server-validated abuse/cost controls and physical-device acceptance.
- iPhone Safari, Android Chrome, VoiceOver, and TalkBack acceptance for the new pilot remain NOT RUN.
- The current Worker capacity remains a shared 60-request-per-minute origin bucket; no quota increase or Worker deployment is included.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Complete controlled real-device quiz STT validation without enabling the pilot on public production.
- Review server-validated learner authorization, per-account throttling, cost monitoring, privacy notice, and safe 429/5xx fallback before any public activation.
