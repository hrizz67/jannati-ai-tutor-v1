# Learning Journey Alignment V1

## Outcome

Learning Journey Alignment V1 is active as a deterministic release gate. All 84 topics across 8 Year 2 subjects pass the complete seven-stage journey with no blockers and no manual-review findings.

| Subject | Topics aligned | Average alignment score |
| --- | ---: | ---: |
| Bahasa Melayu | 14/14 | 94.5 |
| Matematik | 10/10 | 98.0 |
| English | 10/10 | 95.4 |
| Sains | 10/10 | 98.5 |
| Bahasa Arab | 10/10 | 96.4 |
| Pendidikan Islam | 10/10 | 97.7 |
| Pendidikan Jasmani | 10/10 | 96.9 |
| Pendidikan Kesihatan | 10/10 | 97.9 |
| **Overall** | **84/84** | **96.8** |

The average canonical-keyword semantic evidence score is 84.0. Structural coverage is 84/84, with 0 blockers and 0 review findings.

## Seven-stage contract

Every topic must connect these learning stages:

1. An observable objective and curriculum mapping.
2. A concise topic note, child-friendly explanation, and teacher explanation.
3. At least three examples or subject-appropriate modelling activities.
4. Guided practice with sufficient question and hint coverage.
5. Independent assessment with canonical answers and suitable challenge diversity.
6. Diagnostic feedback with answer explanations, common mistakes, and retry support.
7. Remediation and progression using wrong-answer patterns, follow-up questions, related skills, and the adaptive route.

The gate uses two layers:

- Structural rules are strict release blockers.
- Canonical-keyword evidence compares teaching, assessment, and feedback. A strong cluster of assessed concepts absent from the teaching corpus is a blocker; lower-confidence lexical evidence is reported for human review instead of producing a false failure.

## Repairs made from the first audit

The initial run correctly separated detector gaps from content gaps.

- Observable Malay verbs such as `mengenal`, `mengelaskan`, `menghubungkan`, `memilih`, and `mengamalkan` are now recognised.
- Assessment diversity may be demonstrated by cognitive level, difficulty, or question form, which supports age-appropriate vocabulary topics without weakening the gate.
- Bahasa Arab notes for colours, family, animals, and body parts now contain explicit Arabic–Malay meanings and model sentences.
- Mufradat canonical concepts now include the Malay meanings actually taught and assessed.
- Hiwar explicitly teaches `نَعَمْ` as “ya” and `لَا` as “tidak”.
- Jawi questions now carry authored easy/medium/hard and remembering/understanding/applying metadata that reflects their task demands.
- PJ safety teaching now explicitly connects rules, equipment, and safe spaces before those concepts are assessed.

## Automation

Run the focused audit with:

```text
npm run validate:learning-journey
```

The audit also runs automatically during `npm run validate` through `prevalidate`. Its detailed machine-readable output is generated at `reports/validation/learning-journey-alignment.json`, which is intentionally ignored by Git.

The regression suite proves that the gate rejects missing notes, missing answer explanations, and assessment concepts that are not present in the teaching material.

## Main implementation

- `src/ai/learningJourney/learningJourneyAlignmentEngine.js`
- `scripts/validate/learningJourneyAlignmentAudit.mjs`
- `package.json`

## V1 boundary

Semantic evidence is deterministic and explainable; it does not claim to replace a subject expert. Classroom evidence, learner comprehension, live device behaviour, and subtle linguistic equivalence remain part of human acceptance and the future classroom-pilot phase.
