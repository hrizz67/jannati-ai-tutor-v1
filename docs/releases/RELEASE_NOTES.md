# Jannati AI Tutor 3.13.37 Release Notes

Status: stable
Tag: v3.13.37
Build date: 2026-10-29T07:53:20.197Z

## Pre-launch production scope

- Publishes the reviewed frontend to the official production URL for owner-only pre-launch testing with synthetic or disposable test data.
- Does not run a database migration, database push, password reset, Worker deployment, or production-data change.
- Gate A2 backup, encryption, and restore rehearsal remain **NOT RUN / NO-GO**. This release is not evidence of database recovery readiness.
- Wider pupil access, paid launch, and real-child testing remain on hold under open issue #148.

## Tutor improvements since v3.13.36

- Adds reader-aware scrolling for new Tutor replies without moving fully visible short replies.
- Brings partly hidden replies into view minimally and positions long replies at their first line.
- Respects manual scroll-up and exposes an accessible `Balasan baharu ↓` action instead of forcing the reader away from earlier content.
- Transfers keyboard focus to the newly revealed reply before that action disappears, preserves typed drafts, and keeps subsequent Tab navigation inside the modal.
- Prevents delayed programmatic scroll events, context changes, and stale asynchronous replies from corrupting reader-follow state.
- Preserves local-first Tutor behavior, privacy and scope isolation, canonical scoring, protected answers, Mathematics pedagogy, XP, coins, rewards, microphone safety, and nonduplicated screen-reader announcements.

## Security and feature boundaries

- Remote generative AI remains disabled and no paid AI or new network path is introduced.
- The Quiz STT Worker remains disabled by its production server kill switch. This frontend release does not deploy or activate it.
- Existing guardian-consent controls remain in place and are not relaxed.
- Physical iPhone Safari, Android Chrome, VoiceOver, TalkBack, microphone, and consent-flow acceptance remain **NOT RUN** until the tagged frontend is deployed for owner testing.

## Automated release evidence

- Unit tests: 1,319 passed.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Local release build: initial JavaScript 875.84 / 900 kB; entry 310.90 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 117,975 / 125,000 bytes.
- Build structure and credential safety pass; no service-role credential is present in JavaScript assets.

## Outstanding limitations

- Issue #148 remains open because Gate A2 backup/restore evidence and physical-device acceptance are incomplete.
- Cross-device production acceptance and live guardian-consent testing are not claimed by this release.
- Automated checks do not prove real-device scrolling, keyboard, microphone, screen-reader, or production database recovery behavior.

## Rollback

- Previous immutable release: `v3.13.36` at source commit `8e565e293c3ecbca21d594f69baba7b1ec29a92d`.
- Stop owner testing if a critical regression appears. Re-publish the known-good `v3.13.36` frontend through the reviewed tag-based Pages workflow or prepare a reviewed forward-fix; never move or overwrite an existing tag.
- There is no database rollback step for v3.13.37 because this release performs no database change. Gate A2 remains unresolved rather than being marked PASS.
