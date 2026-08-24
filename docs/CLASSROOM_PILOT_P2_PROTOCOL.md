# Classroom Pilot P2 Protocol

## Purpose

This protocol runs a small, consented classroom pilot without treating product analytics as a formal examination result. It measures whether pupils can complete the learning flow, understand questions, use support appropriately, recover after mistakes, and improve topic mastery over time.

The in-app report is formative evidence for teachers. It does not replace PBD evidence, professional teacher judgement, or an official KPM assessment.

## Pilot scope

- Duration: 14 calendar days.
- Suggested first cohort: 6 to 12 Year 2 pupils.
- Focus: two or three curriculum topics already taught in class.
- Schedule: at least two complete app sessions on at least two different days per pupil.
- Minimum evidence per pupil: 10 recorded answer attempts, two completed sessions, two active days, and mastery snapshots for at least 80% of attempts.
- Devices: use the actual school or family devices intended for the full rollout.

## Roles

| Role | Responsibility |
| --- | --- |
| Pilot lead | Confirms scope, consent, devices, incident path and final go/no-go decision. |
| Teacher | Selects taught topics, supervises sessions, records observations and interprets evidence. |
| Parent or guardian | Provides consent when required and understands what data is collected. |
| Technical observer | Records device, network, accessibility and product defects without coaching answers. |
| Product owner | Reviews aggregate exports, defects and teacher feedback; does not request pupil identities. |

## Privacy and safeguarding

1. Obtain school approval and parent or guardian consent before including a pupil.
2. Do not enter a pupil name, email address or school identifier into the pilot report.
3. The app generates a random local participant code such as `PILOT-AB12CD34`.
4. If identity mapping is operationally required, the teacher keeps the code-to-pupil mapping separately in a school-controlled location. Never send that mapping with the exported report.
5. Share only **Eksport Laporan Pilot Tanpa Nama** with the pilot team.
6. **Backup Data Pembelajaran JSON** contains raw learning data for account recovery and must not be used as the teacher analytics export.
7. Do not collect voice transcripts, written responses, screenshots with pupil details, or free-text feedback unless separately approved.
8. Delete exported pilot files according to the school's agreed retention period.

## Operational metric definitions

| Metric | Definition | Interpretation guardrail |
| --- | --- | --- |
| First-attempt accuracy | Correct first responses divided by unique questions attempted. | Closest in-app indicator of initial comprehension; not an exam score. |
| Final-answer accuracy | Correct final responses divided by unique questions attempted. | Shows the result after retry or support. |
| Independent accuracy | Accuracy on attempts with no recorded hint or explanation. | Use only when enough independent attempts exist. |
| Recovery rate | Initially wrong questions later answered correctly. | A learning signal, not evidence that the first misconception disappeared. |
| Supported recovery | Recovery where a later correct attempt used a hint or explanation. | Helps judge whether support is useful. |
| Session completion | Explicitly completed sessions divided by completed plus explicitly abandoned sessions. | Legacy sessions with unknown status are excluded and reported separately. |
| Hint and explanation use | Attempts with each support signal divided by all attempts. | High use is not automatically bad; interpret with accuracy and observation. |
| Misconception pattern | Rule-based category recorded for an incorrect attempt. | Review the classification coverage before drawing conclusions. |
| Mastery change | Latest mastery snapshot minus the first pre-attempt snapshot for each topic in the window. | Formative trend only; it is not a controlled pre-test/post-test effect. |
| Active days and study time | Days with answered questions and locally recorded durations. | Device interruption can affect duration, so use as supporting evidence. |

## Procedure

### 1. Before the pilot

- [ ] Confirm written pilot purpose, cohort, dates and responsible teacher.
- [ ] Obtain required approvals and consent.
- [ ] Select two or three topics that have already been taught.
- [ ] Run `npm run validate:classroom-pilot` and `npm run build` on the intended release.
- [ ] Complete the relevant physical-device checks.
- [ ] Verify that the anonymous pilot export and private backup have clearly different labels.
- [ ] Prepare a separate teacher observation sheet using participant codes only.

### 2. First session

- Let the pupil work independently unless normal classroom support is needed.
- Do not encourage unnecessary hint use merely to generate data.
- Record only observable issues: unclear instruction, navigation hesitation, accidental taps, unreadable text, audio failure, network interruption, or inappropriate feedback.
- Confirm that finishing the activity returns a complete-session record.

### 3. Practice period

- Run at least one further session on a different day.
- Keep topic selection consistent with the intended learning objective.
- Allow pupils to use hints, explanations and retries naturally.
- Do not compare participant codes publicly or rank pupils from the pilot metrics.

### 4. Final review

- Open the **Ringkasan Bukti 14 Hari** panel.
- Confirm the readiness label is **Bukti mencukupi**, or record every evidence gap.
- Export **Laporan Pilot Tanpa Nama**.
- Verify the JSON contains a participant code but no pupil name, email, raw answer, transcript or account ID.
- Combine the report with teacher observations and separately approved learning evidence.

## Acceptance criteria

The product is ready to progress beyond the small pilot when all of the following are true:

- 100% of exported files contain no direct identifiers or raw responses.
- At least 90% of included pupils meet the minimum evidence threshold.
- Support-signal coverage is at least 90% for newly recorded attempts.
- Misconception classification coverage is at least 80% of wrong attempts; unclassified patterns are reviewed.
- Session-completion evidence is at least 90% for finalized sessions.
- No P0 safeguarding, data-loss, inaccessible-core-flow or answer-integrity defect remains open.
- At least 90% of pupils can start, answer, use support, finish and return to the dashboard without adult navigation help.
- The teacher confirms that the report interpretation agrees with classroom observation often enough to be useful, with disagreements documented rather than hidden.

These are product-pilot gates, not pupil pass marks.

## Stop conditions

Pause the pilot immediately if any of these occurs:

- a direct identifier or raw response appears in the anonymous export;
- a pupil can access another pupil's learning data;
- content gives a demonstrably incorrect answer or unsafe instruction;
- progress is repeatedly lost;
- a core flow is unusable with the pupil's required accessibility support;
- consent or school approval is withdrawn.

Record the participant code, device, app version, time, reproduction steps and impact. Do not attach names or raw pupil responses to the defect unless an approved safeguarding process requires it.

## Decision record

At the end of the pilot, choose one outcome:

- **Proceed**: all gates pass and no unresolved P0/P1 issue remains.
- **Proceed with controls**: learning flow is usable, but named mitigations and owners are required.
- **Repeat pilot**: evidence is insufficient or implementation changed materially.
- **Stop**: privacy, safety, answer integrity or accessibility risk is unacceptable.

The decision must reference anonymized evidence, teacher observations, open defects and the tested app version.
