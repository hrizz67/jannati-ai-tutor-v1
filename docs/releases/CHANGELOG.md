# Changelog

## 3.13.36 - 2026-10-29

### Local-first Tutor AI

- Added privacy-bounded local conversation memory and strict child, account, session, topic, and question isolation.
- Added deterministic misconception support, approved examples, adaptive teaching, grounded multilingual follow-ups, and ungraded micro-checks.
- Preserved protected answers, canonical scoring, dedicated Mathematics pedagogy, XP, coins, and rewards.

### Reliability and accessibility

- Cancelled stale Tutor microphone sessions on learner and learning-context changes and ignored late transcripts.
- Added nonduplicated new-message announcements, stable composer focus, deliberate draft preservation, RTL/language semantics, and modal focus lifecycle coverage.
- Optimized Tutor runtime while retaining BM, English, Sains, Arabic, Mathematics, quick-reply, and speech behavior.

### Guardian and release controls

- Added guardian-consent authorization controls for future Quiz STT use while keeping the production Worker disabled.
- Kept remote generative AI disabled and added no paid API or cloud dependency.
- Prepared an owner-only frontend production release without database, Worker, reward-policy, or curriculum changes.
- Gate A2 backup/restore and physical-device acceptance remain NOT RUN / NO-GO; wider pupil and paid launch remain on hold.

### Quality snapshot

- 1,311 unit tests pass; validation reports 0 errors and 0 warnings.
- 8 subjects, 84 topics, and 4,530 questions remain validated.
- Initial JavaScript 875.84 / 900 kB; entry 310.90 / 350 kB; largest chunk 459.49 / 480 kB; Tutor incremental runtime 115,714 / 125,000 bytes.
- Build structure and credential safety pass.
