# CI Pipeline

Jannati AI Tutor V2.0 uses GitHub Actions for pull request and push validation.

## Workflow

File: `.github/workflows/ci.yml`

Triggers:

- `push`
- `pull_request`

## Pipeline Steps

1. Checkout repository with `actions/checkout`.
2. Setup Node.js LTS with `actions/setup-node`.
3. Install dependencies with `npm ci`.
4. Build the app with `npm run build`.
5. Run `npm run validate` when that script exists in `package.json`.
6. Upload QA and curriculum reports as workflow artifacts.
7. Write a workflow summary to the GitHub Actions run summary.

## Failure Rules

The workflow fails when:

- `npm ci` fails.
- `npm run build` fails.
- `npm run validate` exists and returns a non-zero exit code.
- The validator suite reports one or more ERROR severity issues.

The workflow does not fail when:

- `validate` is not present. The validation step is skipped and noted in the summary.
- The validator suite reports INFO or WARNING items without ERROR items.
- No QA report files are present. Artifact upload uses `if-no-files-found: ignore`.

## Uploaded Artifacts

Artifact name: `qa-reports`

Included when present:

- `QA_REPORT*.md`
- `V2*_REPORT.md`
- `V2_ALPHA_QA_REPORT.md`
- `CURRICULUM_COVERAGE_REPORT.md`
- `CURRICULUM_MATRIX.json`
- `reports/validation/**`

## Notes

This pipeline validates build output and the Sprint 10B validation suite. It does not deploy the application and does not modify application features.
