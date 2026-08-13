# Roadmap

## Current baseline

| Area | Status | Evidence |
| --- | --- | --- |
| Production release | v3.2.23 | Tagged and deployed to GitHub Pages |
| Subject question banks | Complete | 8 subjects and 4,530 questions pass the release audit |
| Question quality | Complete | No critical, high, medium, or low audit findings |
| Build and deterministic validation | Complete | Production build and repository validators pass |
| Release automation | Complete | Version, tag, artifact, CI, deploy, and production smoke-test gates pass |
| Learning journey alignment | Complete | 84/84 topics pass objective-to-remediation alignment with zero blockers |
| Browser/device acceptance V1 | Complete | Desktop, 360/390 px, keyboard modal, bidi, reload/resume, and access recovery pass locally |
| Physical-device readiness V1 | Complete | iOS metadata, safe areas, PWA shell, network recovery, speech fallback, and hardware test protocol pass deterministic gates |
| Performance P2 | Complete | Entry JavaScript reduced by 57%, subject banks stage on idle/network quality, and all JavaScript chunks remain below 480 kB |
| Classroom pilot readiness P2 | Complete | Anonymous 14-day metrics cover comprehension, completion, support use, misconceptions, mastery change and evidence quality |

## Next milestones

| Priority | Milestone | Primary outcome |
| --- | --- | --- |
| P1 | Physical-device acceptance (hardware) | Execute and sign the iPhone Safari, Android Chrome, microphone/audio, VoiceOver/TalkBack, and interrupted-network matrix |
| P2 | Classroom pilot execution | Run the consented 14-day protocol, review teacher observations and make a documented rollout decision |

## Learning Journey Alignment V1

The V1 pedagogical gate audits each topic as one connected learning journey:

1. Curriculum objective and observable learning outcome.
2. Concise, age-appropriate note.
3. Worked example or teacher modelling.
4. Guided practice with useful hints.
5. Independent practice and assessment.
6. Diagnostic feedback for common misconceptions.
7. Adaptive remediation or progression to the next skill.

The release gate rejects a topic when an assessment tests canonical content that is not taught, a note lacks an appropriate example, or feedback does not support the intended learning outcome. The current baseline is 84/84 aligned topics with no blockers or review findings.
