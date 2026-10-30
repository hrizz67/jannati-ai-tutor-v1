# Jannati AI Tutor 3.13.38 Release Notes

Status: stable
Target tag: v3.13.38 (not created)
Build date: 2026-10-30T12:26:09.377Z

## Owner-only pre-launch scope

- This preparation contains the four merged P1 remediations from PRs #170, #171, #172, and #173.
- It prepares only the static frontend for controlled owner testing with synthetic or disposable data.
- It does not merge this preparation, create or move a tag, publish a GitHub release, deploy Pages, mutate a database, deploy or enable a Worker, or authorize real-child or paid use.

## Integrated P1 fixes

- **Tutor grounding and follow-ups (#170):** short learner phrases retain active-question context and receive grounded, age-appropriate guidance without weakening protected-answer controls.
- **Logout and pending sync (#171):** logout clears session/account state safely while preserving pending learning-sync protection.
- **Semantic communication scoring (#172):** natural accepted writing variants remain semantically graded while established scoring modes stay intact.
- **Arabic fill blank (#173):** fill-blank grading is strict, hamza-sensitive, and whole-token based; semantic scoring for other writing modes is preserved.

## Security and feature boundaries

- Quiz STT remains server-disabled by `QUIZ_STT_PILOT_ENABLED=false`; this frontend preparation does not deploy or activate its Worker.
- Remote Tutor generative AI remains OFF because no deployment workflow injects `VITE_TUTOR_AI_REMOTE_ENABLED=true`; the gateway is fail-closed and local-first.
- Browser build credential checks pass and no service-role credential is present in JavaScript assets.
- Guardian-consent and child-privacy controls remain unchanged.
- npm currently reports two high-severity advisories in the Node build toolchain (`vite` and transitive `source-map-js`). These packages are not shipped in the static browser artifact, but dependency remediation remains an explicit follow-up before wider rollout.

## Automated evidence

- Unit tests: 86 / 86 files and 1,388 / 1,388 tests passed.
- Focused four-P1 matrix: 5 / 5 files and 107 / 107 tests passed.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Production bundle: initial JavaScript 887.36 / 900 kB; entry 323.17 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 122,049 / 125,000 bytes.
- Production build structure, Supabase configuration, release artifacts, credential safety, STT safety, and Tutor generative-gateway regression passed.

## Gates that remain on hold

- Gate A2 backup, encryption, restore rehearsal, and database rollback evidence remain **HOLD / NOT RUN** under issue #148.
- Physical iPhone Safari, VoiceOver, Android Chrome, TalkBack, microphone, scrolling, focus, resize, and orientation acceptance remain **HOLD / NOT RUN** under issue #156.
- Automated checks do not substitute for those physical-device or recovery gates.

## Controlled deployment proposal after separate authorization

1. Merge the exact reviewed release-prep SHA only after exact-head CI and owner review remain green.
2. Reconfirm `v3.13.38` is unused and main equals the reviewed merge result.
3. Create one immutable annotated tag and let the tag-only deployment workflow validate metadata, artifacts, production configuration, bundle limits, and credentials before Pages publication.
4. Smoke-test the public entry hash and execute owner-only synthetic-data checks; stop on any regression.
5. Keep issues #148 and #156 open and keep real-child and paid rollout blocked.

## Rollback

- Current known production release: `v3.13.37`, source commit `fa8acb8ea293ac829916c6b3b545dacc0f968853`.
- If owner-only testing finds a critical frontend regression, re-publish that immutable release through the reviewed tag-based Pages workflow or prepare a reviewed forward-fix. Never move or overwrite an existing tag.
- No database rollback is implied because v3.13.38 preparation makes no database change.
