# Jannati AI Tutor 3.5.0 Release Notes

Status: stable
Tag: v3.5.0
Build date: 2026-08-20T17:50:33.209Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Contextual AI Teacher

- Tutor AI now understands open learning-planning questions such as “Hari ini saya patut belajar apa?” and requests to learn a named topic.
- Recommendations use the active learner profile and prioritise a topic that needs strengthening within the selected subject.
- When evidence is still limited, Tutor AI says so clearly before suggesting a suitable starting topic instead of pretending to know a weakness.
- Replies include a short teaching plan and a useful follow-up question so the conversation can continue with an explanation or practice.

## Chat-first Experience

- Large persistent help and progress panels are replaced by compact contextual learning tools beneath the conversation.
- Question help appears only when an active question exists, while learning recommendations and progress remain available throughout the chat.
- Empty question-context cards and routine idle status bars no longer consume the conversation area.
- The update changes Tutor AI presentation and response logic only; learner profiles, progress records, sync storage and assessment data remain unchanged.

## Regression Protection

- Conversation tests cover Malay learning-plan variations, named-topic requests, greetings, personalised recommendations and actionable follow-up replies.
- Answer-leak, generative-gateway, access-control, resume-isolation and multi-device learning-sync regressions remain green.

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

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
