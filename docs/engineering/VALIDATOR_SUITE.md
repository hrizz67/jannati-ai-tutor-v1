# Validator Suite

The validator suite is a Node.js validation framework for Jannati AI Tutor content, curriculum metadata, release metadata, app metadata, and browser storage schemas.

## Architecture

Entry points:

- `npm run validate`
- `npm run validate:questions`
- `npm run validate:curriculum`
- `npm run validate:metadata`
- `npm run validate:storage`
- `npm run release:check`

Files:

- `scripts/validate/index.js` runs all validators and writes the master summary.
- `scripts/validate/questionValidator.js` validates question structure.
- `scripts/validate/curriculumValidator.js` validates curriculum mapping and coverage metadata.
- `scripts/validate/metadataValidator.js` validates subject/topic/question metadata shape.
- `scripts/validate/storageValidator.js` validates localStorage schemas and migration keys.
- `scripts/validate/questionAuditRegression.mjs` checks the full question-bank quality audit before the master suite.
- `scripts/validate/releasePipelineAudit.mjs` checks version alignment and fail-closed CI/deploy ordering.
- `scripts/release/verifyReleaseVersion.js` validates package, lockfile, optional tag, and generated release artifacts.

Reports:

- `reports/validation/question-report.json`
- `reports/validation/curriculum-report.json`
- `reports/validation/metadata-report.json`
- `reports/validation/storage-report.json`
- `reports/validation/summary.json`
- `reports/validation/summary.md`
- `reports/validation/validation-summary.md`
- `validation-summary.md`

## Severity Levels

INFO:

- Missing explicit metadata that can be inferred safely, such as SK, SP, or estimated time.

WARNING:

- Duplicate stems.
- Missing hints.
- Missing explanations.

ERROR:

- Broken or non-importable content data.
- Duplicate IDs.
- Invalid answers or answer indexes.
- Structural failures that make content, curriculum, metadata, or storage unsafe.

## Validation Rules

Question validator:

- Duplicate IDs are errors.
- Duplicate stems are warnings.
- Empty question stems are errors.
- Empty option arrays or blank option values are errors.
- Empty answers are errors.
- Invalid answer indexes are errors.
- Missing hints are warnings.
- Missing explanations are warnings.
- Invalid difficulty values are errors.

Curriculum validator:

- Missing subject metadata is an error.
- Missing topic metadata is an error.
- Missing explicit SK/SP is reported as info when the curriculum inference layer can provide normalized SK/SP.
- Missing normalized SK/SP is an error.
- Missing UASA tags are warnings.
- Missing explicit estimated time is info when estimated time can be inferred.
- Invalid estimated time is an error.
- Difficulty balance is summarized in the report.

Metadata validator:

- Invalid or non-importable subject data is an error.
- Invalid subject metadata is an error.
- Invalid topic metadata is an error.
- Invalid difficulty values are errors.
- Invalid estimated time values are errors.

Storage validator:

- AI Memory shape is validated.
- Mastery states must be `NOT_STARTED`, `LEARNING`, `NEEDS_PRACTICE`, or `MASTERED`.
- Reading, Listening, Speaking, and Writing histories must be arrays with valid scores.
- Curriculum Coverage must be an object when present.
- Current and legacy migration keys must remain present in source.
- Corrupted localStorage JSON probes must be detected.

## Exit Codes

- `0`: Validation completed with no errors. Info and warning items may still be present in reports.
- `1`: One or more hard validation errors were found, or the validator crashed.

GitHub Actions fails when release metadata, `npm run validate`, or the production build returns a non-zero code. Stable release preparation additionally rejects validation warnings.

## Future Extensions

- Add a schema file for each report type.
- Add severity configuration for alpha, beta, and production release gates.
- Convert inferred SK, SP, cognitive level, estimated time, and learning outcomes into teacher-reviewed explicit metadata.
- Add automated Learning Journey Alignment checks between objectives, notes, examples, practice, assessment, and feedback.
- Add a browser-storage fixture runner for real exported localStorage snapshots.
