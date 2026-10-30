# Changelog

## 3.13.38 - 2026-10-30

### P1 remediation integration

- Preserves pending learning-sync work during logout while clearing account-scoped session state safely.
- Keeps semantic scoring for communication and other writing modes, including accepted natural variants, without weakening exact-answer boundaries.
- Improves Tutor grounding and natural follow-up handling for short learner phrases while preserving protected-answer and local-first controls.
- Applies strict hamza-sensitive whole-token grading to Arabic fill-blank responses without changing semantic scoring for other writing modes.

### Owner-only release boundary

- Prepares the reviewed frontend for owner-only pre-launch testing with synthetic or disposable test data.
- Remote generative AI and the Quiz STT Worker remain disabled. No database migration, Worker deployment, paid API, curriculum, XP, coin, reward, bundle-threshold, or privacy-gate change is included.
- Gate A2 issue #148 and physical acceptance issue #156 remain **HOLD / NOT RUN**. No real-child or paid rollout is authorized.

### Quality snapshot

- 86 unit-test files and 1,388 tests pass; validation reports 0 errors, 0 warnings, and 14,816 informational items.
- All 8 subjects, 84 topics, and 4,530 questions remain validated.
- Initial JavaScript 887.36 / 900 kB; entry 323.17 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 122,049 / 125,000 bytes.
- Build structure, production configuration, credential safety, release-artifact verification, STT safety, and Tutor gateway regression pass.

### Follow-up work

- Complete Gate A2 backup/encryption/restore evidence under issue #148 before any wider launch.
- Complete physical iPhone Safari, VoiceOver, Android Chrome, TalkBack, microphone, scrolling, focus, and orientation acceptance under issue #156.
- Review and update the build toolchain for the two current high-severity npm advisories affecting Vite/source-map tooling. The static production bundle does not include those Node build packages, but the dependency audit is not clean.
