# Jannati AI Tutor 3.13.36 Release Notes

Status: stable
Tag: v3.13.36
Build date: 2026-10-29T03:00:08.289Z

## Pre-launch production scope

- Publishes the reviewed frontend to the official production URL for owner-only pre-launch testing with synthetic or disposable test data.
- Does not run a database migration, database push, password reset, Worker deployment, or production-data change.
- Gate A2 backup, encryption, and restore rehearsal remain **NOT RUN / NO-GO**. This release must not be represented as proof of database recovery readiness.
- Wider pupil access, paid launch, Gate A2, v3.13.36 physical-device acceptance, and production Quiz STT activation remain on hold.

## Tutor AI improvements since v3.13.35

- Adds privacy-bounded, local-first conversation memory with strict child, account, session, topic, and question isolation.
- Adds deterministic misconception support, approved authored examples, adaptive teaching steps, grounded multilingual follow-ups, and ungraded micro-check dialogue.
- Preserves canonical quiz scoring, protected-answer policy, Mathematics pedagogy, XP, coins, rewards, and speech integration.
- Cancels stale microphone activity across Tutor context changes and rejects late transcripts from a previous learner or question.
- Improves accessible chat announcements, composer focus, draft preservation, RTL/language semantics, and modal focus restoration.
- Remote generative AI remains disabled; Tutor responses continue to use the reviewed local-first path with no new paid API.

## Guardian and Quiz STT boundaries

- Adds reviewed guardian-consent controls and bounded authorization resources for any future Quiz STT activation.
- The Quiz STT Worker remains disabled by its production kill switch. This frontend release does not deploy or activate the Worker.
- The current frontend permits only an explicit pilot URL opt-in; authentication, current guardian consent, Worker access controls, rate limits, quota, and the server kill switch remain mandatory.
- Physical iPhone Safari, Android Chrome, VoiceOver, TalkBack, microphone, and consent-flow acceptance remain **NOT RUN**.

## Automated release evidence

- Unit tests: 1,311 passed.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Local release build: initial JavaScript 875.84 / 900 kB; entry 310.90 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 115,714 / 125,000 bytes.
- Build structure and credential safety pass; no service-role credential is present in JavaScript assets.

## Outstanding limitations

- Issue #148 remains open because Gate A2 backup/restore evidence and physical-device acceptance are incomplete.
- Cross-device production acceptance and live guardian-consent testing are not claimed by this release.
- Automated checks do not prove real-device microphone, screen-reader, or production database recovery behavior.

## Rollback

- Last production release before this release: immutable tag `v3.13.35` at source commit `95ddf57fe7ad4c020878ea8055e9dcaf57019b38`.
- Stop owner testing if a critical regression appears. Recover the frontend through the reviewed tag-based release path using the known-good `v3.13.35` source; never move or overwrite an existing tag.
- There is no database rollback step for v3.13.36 because this release performs no database change. Gate A2 remains unresolved rather than being marked PASS.
