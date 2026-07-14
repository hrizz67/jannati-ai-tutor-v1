# Jannati AI Tutor v2.0 - Curriculum Mapping Phase 1 Report

Generated: 2026-07-14T12:11:00Z

## Summary

This phase improves curriculum metadata only. Question text, answers, hints, explanations, and AI behavior were not changed.

Audit results after the mapping update:

- SK mapping: 100%
- SP mapping: 100%
- Verified SK/SP: 57%

Previous audit baseline:

- SK mapping: 52%
- SP mapping: 52%
- Verified SK/SP: 0%

Review required questions:

- 2000

## Source of truth used

1. Existing topic structure in the subject banks
2. Existing curriculum matrix in the repository
3. Existing topic notes and question context

No question content was rewritten.

## Per-subject mapping summary

| Subject | Questions | Verified SK | Verified SP | Review Required | Coverage |
|---|---:|---:|---:|---:|---:|
| Bahasa Melayu | 800 | 800 | 800 | 0 | 100% |
| Mathematics | 800 | 800 | 800 | 0 | 100% |
| English | 500 | 500 | 500 | 0 | 100% |
| Science | 500 | 500 | 500 | 0 | 100% |
| Bahasa Arab | 500 | 0 | 0 | 500 | 100% |
| Pendidikan Islam | 500 | 0 | 0 | 500 | 100% |
| Pendidikan Jasmani | 500 | 0 | 0 | 500 | 100% |
| Pendidikan Kesihatan | 500 | 0 | 0 | 500 | 100% |

## Overall mapping coverage

| Metric | Before | After |
|---|---:|---:|
| SK mapping | 52% | 100% |
| SP mapping | 52% | 100% |
| Verified SK/SP | 0% | 57% |

## Questions verified

Verified mappings were applied to the subjects already covered directly in the repository curriculum matrix:

- Bahasa Melayu
- Mathematics
- English
- Science

## Questions needing review

These subjects now have explicit topic-level SK/SP metadata, but the mappings remain review required until official verification is completed:

- Bahasa Arab
- Pendidikan Islam
- Pendidikan Jasmani
- Pendidikan Kesihatan

## Missing curriculum metadata

- None at the topic-mapping level after this phase

## Possible duplicate mappings

- None detected in the updated mapping file

## Audit result

`node scripts/audit/curriculumAudit.js`

- 100% metadata
- 100% mapped SK
- 100% mapped SP
- 57% verified

`node scripts/audit/subjectCoverage.js`

- Audit written successfully for all 8 subjects

## Notes

- This phase improves explicit curriculum mapping without rewriting questions.
- Review-required subjects can be upgraded to verified later only after official DSKP verification.
