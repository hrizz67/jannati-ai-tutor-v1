# Roadmap

## Current baseline

| Area | Status | Evidence |
| --- | --- | --- |
| Production release | v3.2.22 | Tagged and deployed to GitHub Pages |
| Subject question banks | Complete | 8 subjects and 4,530 questions pass the release audit |
| Question quality | Complete | No critical, high, medium, or low audit findings |
| Build and deterministic validation | Complete | Production build and repository validators pass |
| Release automation | In progress | Version, tag, artifact, CI, deploy, and smoke-test gates being consolidated |

## Next milestones

| Priority | Milestone | Primary outcome |
| --- | --- | --- |
| P0 | Release hardening | One version source, tag-gated deployment, and production smoke testing |
| P1 | Learning Journey Alignment V1 | Every objective links to notes, examples, practice, assessment, feedback, and remediation |
| P1 | Browser and device acceptance | Automated core journeys plus real-device Safari, speech, RTL, and accessibility checks |
| P2 | Performance | Reduce the initial bundle and large BM/Mathematics chunks through safer lazy loading |
| P2 | Classroom pilot | Measure comprehension, completion, hint use, misconceptions, and mastery improvement |

## Learning Journey Alignment V1

The next pedagogical phase will audit each topic as one connected learning journey:

1. Curriculum objective and observable learning outcome.
2. Concise, age-appropriate note.
3. Worked example or teacher modelling.
4. Guided practice with useful hints.
5. Independent practice and assessment.
6. Diagnostic feedback for common misconceptions.
7. Adaptive remediation or progression to the next skill.

The release gate should reject a topic when an assessment tests content that is not taught, a note lacks an appropriate example, or feedback does not support the intended learning outcome.
