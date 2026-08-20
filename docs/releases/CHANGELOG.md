# Changelog

## 3.5.0 - 2026-08-20

### Contextual Tutor AI

- Added recognition for open learning-planning questions, named-topic learning requests and natural Malay phrasing.
- Added profile-aware topic recommendations that favour the selected subject and topics requiring more support.
- Added an evidence-aware fallback that clearly states when there is not enough learning history to identify a weak topic.
- Added short teaching plans and follow-up choices so Tutor AI continues as a two-way teacher instead of returning generic advice.

### Chat-first interface

- Replaced the two large persistent action panels with compact contextual learning tools beneath the conversation.
- Showed question-help controls only when a real exercise context exists.
- Removed empty question-context cards and hid idle status bars that reduced usable chat space.
- Preserved learner profiles, progress, sync, resume and assessment data without schema or storage changes.

### Regression protection

- Covered learning recommendations, named-topic requests, greetings and personalised follow-up actions in Tutor conversation regression tests.
- Retained answer-leak safety and local curriculum grounding while keeping the under-18 generative gateway privacy gate unchanged.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
