# Jannati AI Tutor 3.10.0 Release Notes

Status: stable
Tag: v3.10.0
Build date: 2026-09-06T05:05:07.298Z

## Highlights

- Completes controlled architecture and data-isolation hardening across Batches 1-5 without replacing React, Vite, Supabase, the design system, or the question bank.
- Uses stable account and child identifiers for learner state, resume data, analytics, rewards, Tutor AI context, and guarded legacy migration.
- Adds a focused ESLint gate, nine Vitest unit tests, and new regression coverage for architecture, child isolation, parent mode, access, quota, language, and answer-reveal safety.
- Derives the service-worker cache namespace from application version `3.10.0`, reducing stale-cache risk across deployments.
- Preserves lazy loading and passes all production bundle budgets.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14816
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2086, sederhana 1753, sukar 691

## Known Follow-ups

- The previously observed desktop/mobile Supabase XP mismatch still requires live-account, two-device verification; automated isolation and conflict tests pass but do not replace that evidence.
- Playwright was deliberately deferred to avoid adding a browser runtime before stable authentication, Supabase, voice, and physical-device fixtures exist.
- Initial JavaScript is 880.05 kB against a 900 kB budget; large chunks remain a P2 performance target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.

## Readiness Decision

- Closed beta: READY, with monitoring and recoverable test data.
- Wider beta: NOT YET READY until cross-device sync and critical physical-device flows are evidenced.
- Paid public release: NOT READY.
