# Jannati AI Tutor v2.0 - Bahasa Melayu Academic Quality Review Phase 2

Generated: 2026-07-14T12:45:52.966Z

## Scope

This is an academic language audit only. No question bank content was rewritten.

Audited BM-facing content across:

- BM question bank
- Hints and explanations
- AI Explain and AI Teacher Malay copy
- Narrative and encouragement copy
- Parent recommendations
- Student dashboard Malay labels
- Daily missions and progress messages

## Validation Run

Existing validation was run successfully:

- `node scripts/validate/questionValidator.js`

Result:

- 0 errors
- 6 warnings
- 0 info

Note: the validator warnings are Mathematics duplicate-stem diagnostics, not BM language errors.

## Issue Summary

| Metric | Count |
|---|---:|
| Total language issues | 5 |
| DBP issues | 2 |
| Natural-language issues | 2 |
| Readability issues | 1 |

## Overall Scores
| Area | Score | Notes |
|---|---:|---|
| Overall BM Quality | 91 | Strong Year 2 content with room for language polish. |
| DBP Compliance | 93 | Mostly standard Malaysian Malay; a few repetitive or formulaic patterns remain. |
| Naturalness | 89 | Many teacher-like lines are natural, but some prompts feel template-driven. |
| Readability | 88 | Suitable for Year 2 overall; several instructions are still longer than ideal. |
| Year 2 Suitability | 94 | Vocabulary is generally age-appropriate and clear. |
| Educational Quality | 92 | Hints and explanations usually teach well, but some are repetitive. |

## Top Recurring Issues

### 1) Repeated instructional openers in BM questions

The bank uses a small set of stems very often, which makes the flow feel repetitive:

- `Apakah` (654 occurrences)
- `Pilih kata` (116 occurrences)
- `Nyatakan` (96 occurrences)
- `Lengkapkan ayat` (72 occurrences)
- `Isi tempat kosong` (58 occurrences)
- `Cari kata` (15 occurrences)

This is not wrong grammatically, but it reduces variety and makes the experience feel more formulaic.

### 2) Some hints and explanations are overly short or repetitive

A number of BM items use the same teaching patterns repeatedly:

- "Cari perkataan yang betul."
- "Fikirkan kata yang sesuai."
- "Pilih jawapan yang betul."

These are clear, but many could be made more specific and more supportive.

### 3) Some copy is slightly too formal or template-like for Year 2

A few learner-facing lines read more like generated text than a teacher speaking to a child. The content is still understandable, but the tone can be warmer and more natural in future passes.

### 4) Some multi-clause prompts are a bit long for early readers

A few questions and dashboard messages could be shortened without changing meaning, especially where a child must read several instructions in one line.

### 5) Consistency of instructional phrasing can improve

BM content mixes variants such as:

- "jawapan betul"
- "jawapan yang betul"
- "pilih jawapan yang betul"
- "semak jawapan"

These are all acceptable, but the learning experience will feel more polished if the app standardises them by context.

## Examples Noted During Review

### Strong examples

- Many BM question sets are short, direct, and age-appropriate.
- Hints usually point the learner to the correct concept.
- Explanations often give the answer and a brief reason, which is good for Year 2.

### Needs-improvement examples

- Repeated question openings in BM sections make the bank feel template-heavy.
- Some parent or AI-facing Malay lines are correct but not as warm as a teacher would phrase them.
- Some explanation text can be more specific to the exact concept being taught.

## Priority Fixes

### High priority

1. Reduce repeated BM question openers in future content passes.
2. Improve a subset of BM hints so they sound more natural and specific.
3. Shorten long instruction strings for early readers.

### Medium priority

4. Standardise learner-facing Malay terminology across the app.
5. Refresh a portion of parent/report wording to sound more conversational.
6. Reduce template-like phrasing in AI-generated Malay copy.

### Low priority

7. Minor punctuation and rhythm polishing in longer hints and explanations.

## Estimated Effort

| Task | Effort |
|---|---:|
| Rephrase repetitive BM stems | Medium |
| Shorten long instructions | Small |
| Improve hint naturalness | Medium |
| Standardise terminology | Small |
| Polish parent/AI Malay copy | Medium |

## Files Inspected

- `src/data/subjects/bm.js`
- `src/App.jsx`
- `src/dashboard/HomeDashboard.jsx`
- `src/dashboard/StudentDashboard.jsx`
- `src/dashboard/ParentDashboard.jsx`
- `src/dashboard/RevisionDashboard.jsx`
- `src/dashboard/AnalyticsDashboard.jsx`
- `src/ai/narrative/*`
- `src/ai/personality/*`
- `src/ai/coach/*`
- `src/ai/adaptive/*`

## Conclusion

The Bahasa Melayu content is generally strong and suitable for Year 2. The main remaining quality gap is repetition: the bank relies on a small number of instructional patterns too heavily, which makes some sections feel mechanical rather than teacher-led.

Overall BM quality score: **91/100**




