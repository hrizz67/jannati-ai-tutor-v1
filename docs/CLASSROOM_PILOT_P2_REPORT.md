# Classroom Pilot Readiness P2 Report

## Outcome

The application is ready to run a small, consented classroom pilot and produce a privacy-safe formative report. Actual classroom effectiveness has not yet been claimed; that requires execution of the protocol with real pupils and teacher observation.

## Implemented

- A pure aggregate reporting engine for a rolling 14-day pilot window.
- Separate comprehension measures for first attempt, final answer, independent attempts and recovery after an error.
- Explicit tracking of hint use, explanation use, misconception category, mastery before/after and completed versus abandoned sessions.
- Evidence sufficiency gates: 10 attempts, two completed sessions, two active days and at least 80% mastery-snapshot coverage.
- A teacher-facing **Ringkasan Bukti 14 Hari** panel in Analytics.
- An anonymous export with a random, locally generated participant code.
- A clear separation between the anonymous pilot report and the raw learning-data backup used for recovery.
- Automated privacy and metric regression coverage.

## Privacy contract

The classroom-pilot export is allow-list based. It includes aggregate metrics, dates, subject/topic identifiers and a random participant code. It excludes pupil name, email, account or student ID, question ID, raw answer, correct answer, transcript, feedback comments and local-storage backup data.

## Metrics

| Area | Implemented evidence |
| --- | --- |
| Comprehension | First-attempt, final-answer and independent accuracy |
| Completion | Explicit complete, abandoned, ongoing and unknown session status |
| Support | Hint, explanation and supported-recovery rates |
| Misconceptions | Wrong-attempt count, classification coverage and top categories |
| Mastery | Per-topic baseline, current value and change |
| Engagement | Active days, attempts and recorded study minutes |
| Coverage | Number of subjects and topics represented |
| Trust | Per-signal data-quality coverage and limitations |

## Automated evidence

`npm run validate:classroom-pilot` verifies deterministic metric calculations, explicit session completion, event wiring, anonymous-export privacy, teacher-facing UI wiring and the private-backup label. The audit uses deliberately sensitive fixture fields and fails if any are copied into the report.

## Remaining field work

- Obtain approval and consent for the selected cohort.
- Run the real iPhone, Android, microphone/audio and assistive-technology matrix required by the physical-device protocol.
- Execute the 14-day protocol in `docs/CLASSROOM_PILOT_P2_PROTOCOL.md`.
- Review teacher observations, anonymized exports and defects before making a rollout decision.
