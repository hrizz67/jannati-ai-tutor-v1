# Changelog

## 3.13.37 - 2026-10-29

### Tutor chat reliability

- Added reader-aware Tutor scrolling: fully visible short replies remain still, partly hidden replies move only as needed, and long replies start at their first line.
- Preserved manual scroll position and added an accessible `Balasan baharu ↓` action when the reader is following earlier content.
- Moved keyboard focus to a newly revealed Tutor reply before the new-reply action unmounts, while preserving the learner's typed draft and modal focus containment.
- Protected reader-follow state from delayed programmatic scroll events, context changes, and stale asynchronous replies.
- Preserved nonduplicated screen-reader announcements, composer focus, RTL/language semantics, and microphone cleanup from the previous release.

### Pre-launch release boundaries

- Publishes the reviewed frontend for owner-only pre-launch testing with synthetic or disposable test data.
- Remote generative AI and the Quiz STT Worker remain disabled. No database migration, Worker deployment, paid API, curriculum, scoring, XP, coin, or reward change is included.
- Gate A2 backup/restore evidence remains **NOT RUN / NO-GO** under open issue #148; wider pupil and paid launch remain on hold.
- Physical iPhone Safari, VoiceOver, Android Chrome, TalkBack, and microphone acceptance remain **NOT RUN** until the tagged frontend is available for owner testing.

### Quality snapshot

- 1,319 unit tests pass; validation reports 0 errors and 0 warnings.
- 8 subjects, 84 topics, and 4,530 questions remain validated.
- Initial JavaScript 875.84 / 900 kB; entry 310.90 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 117,975 / 125,000 bytes.
- Build structure and credential safety pass.

### Follow-up work

- Complete the documented owner-only physical Safari, speech, RTL, and accessibility acceptance checks.
- Keep issue #148 and Gate A2 open until backup, encryption, restore, and production recovery evidence exists.
