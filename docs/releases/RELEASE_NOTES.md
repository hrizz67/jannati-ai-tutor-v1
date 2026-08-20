# Jannati AI Tutor 3.4.0 Release Notes

Status: stable
Tag: v3.4.0
Build date: 2026-08-20T16:04:25.276Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Tutor AI Two-Way Teaching

- Tutor AI now recognises what a learner is asking, including concept questions, comparisons, reasons, methods, misunderstandings, requests for another explanation, and follow-up turns.
- Conversation context is carried into follow-up prompts so the learner can ask for an example or a different explanation without restarting the topic.
- Replies guide the learner in small steps and finish with a comprehension check or clickable quick response.
- The local curriculum engine always answers first and remains available if any optional remote service is unavailable.

## Privacy and Child Safety

- The optional generative gateway is authenticated, Premium-gated on the server, rate-limited, origin-restricted, and disabled by default.
- Remote payloads exclude learner identity, progress, scores, rewards, complete profiles, answer banks, and sync data.
- Known learner names are redacted, obvious personal-data prompts are stopped locally, and high-risk prompts route to an age-appropriate adult-help response.
- Input and output moderation, strict JSON Schema output, pseudonymous safety identifiers, and fail-closed local fallback protect every remote call.
- Enabling remote generation still requires explicit under-18 compliance confirmation, approved data controls, server-only secrets, and a supervised pilot.

## Compatibility and Acceptance

- Existing questions, notes, textbooks, assessments, resume state, and multi-device learning data are unchanged.
- Free-account Tutor AI blocking passed on desktop and at a 390-pixel mobile viewport.
- The mobile access view has no horizontal overflow, its primary controls remain at least 50 pixels high, and the browser reported no runtime warnings.
- The deployed `tutor-ai` Edge Function is active with JWT verification; an unauthenticated request is rejected with HTTP 401.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14660
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2065, sederhana 1363, sukar 1102

## Known Follow-ups

- Run Premium end-to-end acceptance against the newly deployed v3.4.0 frontend before considering remote generation.
- Keep remote generation disabled until the under-18 privacy and data-retention review is approved.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
