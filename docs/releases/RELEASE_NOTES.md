# Jannati AI Tutor 3.13.23 Release Notes

Status: stable
Tag: v3.13.23
Build date: 2026-10-11T14:56:26.051Z

## Public Launch Readiness

- Customer-visible beta, demo, and testing wording has been removed, and account login copy is clearer.
- Internal feedback, QDE, and classroom-pilot surfaces remain hidden from the normal production experience.
- Public account recovery now covers forgotten passwords, recovery-session finalization, confirmation resend, and invalid or expired e-mail links.
- Public Privacy, Terms, and Support pages provide account/data deletion guidance, manual refund and payment-review guidance, and global footer links.

## Commercial and Technical Boundaries

- Manual Premium sales remain manual, with no payment gateway or automatic Premium activation.
- Refund review remains manual; this release does not promise automatic refunds.
- Account deletion guidance is provided, but no automated backend account deletion is added.
- This release makes no database, schema, RPC, P1.13 sync, reward, STT/voice, or question-bank changes.

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
