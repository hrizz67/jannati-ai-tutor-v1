# Jannati AI Tutor 3.13.33 Release Notes

Status: stable
Tag: v3.13.33
Build date: 2026-10-22T10:47:04.556Z

## P1.17 Authenticated Quiz MediaRecorder-STT Rollout Readiness

- Adds the reviewed production path for mobile Quiz speech through a dedicated Quiz STT Worker. The Quiz endpoint is separate from the existing Bacaan/Bertutur Worker.
- Every transcription request requires a Supabase access token that is revalidated server-side. Anonymous, invalid, and expired sessions fail closed.
- Production access can be restricted to a consented adult allowlist for physical acceptance and, only after that acceptance passes, changed to all registered Jannati accounts.
- Production CORS is restricted to the official GitHub Pages origin. Existing per-account and global rate limits, the 1 MiB upload limit, and the eight-second browser capture limit remain enforced.
- The committed Worker default is disabled through the emergency kill switch. Deploying this frontend release does not authorize enabling speech for all users.
- Quiz recording requires an explicit learner action and a clear consent acknowledgement by an adult, parent, or guardian. Manual typing remains available, transcripts remain editable, and speech is not graded automatically.
- No audio persistence, transcript logging, learner-content logging, or browser credential is added.

## Controlled Activation Boundary

- The production Quiz Worker must first be deployed with `QUIZ_STT_PILOT_ENABLED=false` and verified to return `pilot-disabled`.
- A time-bounded physical test may then use one approved adult account in allowlist mode on iPhone Safari and Android Chrome.
- If either device or a security control fails, the Worker must be disabled immediately. General registered-user access remains prohibited until both physical tests pass.
- The rollout uses the existing free-plan allocation only. No card, paid upgrade, quota increase, or automatic paid overage is authorized by this release.
- The public query parameter is not treated as access control. Production eligibility is determined by the production build policy plus server-side authentication and Worker policy.

## Preserved P1.17 and P1.16 Scope

- Preserves the native Web Speech microphone lifecycle and explicit `Mikrofon` → `Selesai` flow introduced in P1.17-V03 through V05, including bounded native-`onend` recovery, stale-session cleanup, and editable manual fallback.
- Existing Bacaan/Bertutur behavior, desktop Quiz behavior, reward, XP, coins, cloud sync, Premium/payment, Supabase schema/RPC, and all 4,530 question contracts remain unchanged.
- Carries forward the P1.16 teacher-reviewed interactive expansion across all eight Year 2 subjects: 292 authored interactions, 985 derived auto-safe interactions, and 1,277 runtime-interactive questions.
- Preserves the deferred communication bundle, accessibility and recovery hardening, and isolated QA-preview boundary. QA-only configuration is not enabled in the public application.

## Release Readiness

- Package, lockfile, tag metadata, generated reports, and release artifacts are aligned to 3.13.33.
- Unit tests: 1,037 passed.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Production-equivalent bundle: initial JavaScript 869.32 / 900 kB, entry 304.29 / 350 kB, largest lazy chunk 459.49 / 480 kB, Tutor incremental runtime 107.94 / 125 kB.
- Credential safety, build structure, speech/STT regressions, Worker tests, QA-preview isolation, and release-pipeline audits pass.

## Physical Acceptance Status

- Quiz MediaRecorder-STT on iPhone Safari: **NOT RUN**.
- Quiz MediaRecorder-STT on Android Chrome: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- General registered-user activation: **BLOCKED pending both mobile physical tests**.
- Existing native Web Speech and Bacaan/Bertutur physical regression for this release: **NOT RUN**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone exception remains **OPEN / NOT VERIFIED**.
- Automated tests prove the bounded software contracts; they do not prove physical microphone reliability or privacy-indicator clearance.

## Rollback Reference

- Previous stable immutable release: `v3.13.32` at source commit `7a798878b92bee0f1206d843165569ef2ba5bcc9`.
- Previous deployed GitHub Pages commit before this release: `8a6293d7393ed9ba6fc30416b953d281d362990e`.
- The first operational rollback is the dedicated Quiz Worker kill switch. Frontend rollback uses the repository's existing immutable tagged deployment path; do not retag or force-push.
