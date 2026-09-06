# Jannati AI Tutor 3.10.1 Release Notes

Status: stable
Tag: v3.10.1
Build date: 2026-09-06T06:15:54.747Z

## Highlights

- Fixes successful account login remaining stuck on the login page while Supabase learning data is loading.
- Opens the correct account-scoped device dashboard immediately, then hydrates profile and learning data safely in the background.
- Adds an eight-second cloud timeout, request abort support, automatic retry, and deduplication for simultaneous authentication callbacks.
- Keeps cloud autosave disabled until hydration is verified, so a timeout cannot overwrite an existing learner snapshot.
- Keeps an active quiz open during background retry and clears stale cloud revision metadata when accounts change.

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

- The previously observed desktop/mobile Supabase XP mismatch still requires a same-account, same-child physical-device verification after deployment.
- Live login should be rechecked on desktop and mobile against production Supabase after the tagged deployment completes.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.

## Readiness Decision

- Closed beta hotfix: READY for tagged deployment.
- Wider beta: NOT YET READY until cross-device XP synchronization and critical physical-device flows are evidenced.
- Paid public release: NOT READY.
