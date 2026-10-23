# Jannati AI Tutor 3.13.34 Release Notes

Status: stable
Tag: v3.13.34
Build date: 2026-10-23T10:36:08.736Z

## Production Deployment Smoke Repair

- Repairs the tagged-release smoke gate so it validates Supabase configuration across the complete verified production JavaScript build, including deferred vendor and lazy chunks, instead of assuming the configuration is present in the entry chunk.
- Builds an expected same-origin JavaScript asset manifest from the local production output and verifies the deployed HTML entry name plus the SHA-256 content of every expected JavaScript asset.
- Rejects missing, redirected, cross-origin, stale, or mixed-release JavaScript assets before checking production configuration.
- Reuses the existing production Supabase guard across the combined verified assets, preserving rejection of placeholders, service-role credentials, secret keys, missing configuration, and conflicting project configuration.
- Verifies Supabase Auth health and CORS without printing credentials or sensitive response bodies. Existing bounded GitHub Pages propagation retries remain in place.
- The failed immutable `v3.13.33` tag is not deleted, moved, or force-updated. This patch prepares a new immutable release path through `v3.13.34`.
- Tagged production builds explicitly set Quiz MediaRecorder-STT automatic activation to `false`. Mobile Quiz retains the previous native speech behavior where supported, with editable manual typing always available.

## Preserved P1.17 Safety Boundary

- The dedicated Quiz STT Worker remains OFF through its committed emergency kill switch. This release preparation does not activate Quiz STT or authorize general registered-user access.
- Existing Bacaan/Bertutur behavior, desktop Quiz behavior, reward, XP, coins, cloud sync, Premium/payment, Supabase schema/RPC, and all 4,530 question contracts remain unchanged.
- Quiz recording still requires explicit learner action and adult, parent, or guardian consent. Manual typing remains available, transcripts remain editable, and speech is not graded automatically.
- No audio, transcript, credential, or learner-content persistence is added.

## Release Readiness

- Package, lockfile, tag metadata, generated reports, and release artifacts are aligned to 3.13.34.
- Unit tests: 1,050 passed, including 12 focused deployment-smoke regressions and a tagged-production Quiz STT disable regression.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Production-equivalent bundle: initial JavaScript 869.33 / 900 kB, entry 304.29 / 350 kB, largest lazy chunk 459.49 / 480 kB, Tutor incremental runtime 107.94 / 125 kB.
- Credential safety, build structure, speech/STT regressions, Worker tests, QA-preview isolation, and release-pipeline audits pass.

## Physical Acceptance Status

- Quiz MediaRecorder-STT on iPhone Safari: **NOT RUN**.
- Quiz MediaRecorder-STT on Android Chrome: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- General registered-user Quiz STT activation: **BLOCKED pending both mobile physical tests and separate authorization**.
- Existing native Web Speech and Bacaan/Bertutur physical regression for this release: **NOT RUN**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone exception remains **OPEN / NOT VERIFIED**.
- Automated tests prove bounded software contracts; they do not prove physical microphone reliability or privacy-indicator clearance.

## Rollback Reference

- Last stable completed release: `v3.13.32` at source commit `7a798878b92bee0f1206d843165569ef2ba5bcc9`.
- GitHub Pages commit before the partial `v3.13.33` publish: `8a6293d7393ed9ba6fc30416b953d281d362990e`.
- The partially published `v3.13.33` Pages commit is `e73d376d47788b65993f7079a8d6e0740887284f`; its official deployment workflow did not complete successfully.
- Frontend rollback must use the repository's existing immutable tagged deployment path. Do not retag or force-push `v3.13.33`.
