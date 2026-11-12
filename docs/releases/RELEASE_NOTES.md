# Jannati AI Tutor 3.13.41 Release Notes

Status: stable
Tag: v3.13.41
Build date: 2026-11-12T15:39:56.582Z

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

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.

## Owner-only rollout and previous tag incident
- v3.13.40 was TAGGED but its production deploy was stopped **before GitHub Pages publication**: initial JavaScript was 900.19 kB against the unchanged strict 900 kB budget. That tag is preserved and not overwritten.
- v3.13.41 defers the version-scoped service-worker registration module until the already-established window load event. Service-worker behavior and registration failure fallback are retained; this reduces initial loading overhead without relaxing budgets.
- An isolated exact production-flag build of the remediation candidate passed the 900 kB budget at **899.75 kB**. The tagged deployment must independently recheck its bundle budget and all original release gates.
- OWNER-ONLY PRELAUNCH: Chrome/phone QA with synthetic data only. No child pilots, paid users, Gate A2 or release safety waiver.
- Remote generative AI and automatic Quiz STT remain OFF. No Worker, backend schema, database or authentication changes.
- Native 200% browser zoom, iOS Safari/VoiceOver, Android Chrome/TalkBack acceptance remain NOT RUN until owner testing.
