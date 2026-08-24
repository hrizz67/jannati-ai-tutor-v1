# V3 English Deep Content Audit

## Root causes addressed

The second-pass audit added explicit detection for bilingual contamination, incomplete prompts, truncation, unresolved template values, malformed joins, question-type mismatches and fallback leakage. These checks sit in the reusable English quality layer rather than in individual question records.

## Coverage

| Metric | Result |
|---|---:|
| Static English questions | 500 |
| Generated samples | 10,000 |
| Topics/templates | 10 |
| Fallback paths checked | 6 |
| Repaired samples | 11 |
| Regenerated samples | 60 |
| Rejected samples | 0 |
| High-severity findings after normalization | 0 |

## New checks

- controlled Malay-token and mixed-language detection;
- incomplete question and instruction detection;
- fill-in-the-blank and rearrange-task completeness;
- truncation endings, unmatched punctuation and unfinished blanks;
- unresolved placeholders and template tokens;
- normalized fragment joining and duplicate-article/fragment detection;
- option language/answer consistency;
- child-facing normalization for `undefined`, `null`, object text and internal IDs.

Malay explanations around an English example remain allowed in Tutor AI context. English lesson sentences and options must remain English unless explicitly marked as translation content.

## Representative repairs

| Before | After |
|---|---|
| Ali membaca a book. | Ali reads a book. |
| She pergi to school. | She goes to school. |
| Murid itu is happy. | The pupil is happy. |
| Aina reads buku cerita. | Aina reads a storybook. |
| Choose the correct | Choose the correct answer |
| Fill in the | Fill in the blank |
| The cat is is small. | The cat is small. |

## Duplicate clusters

Two duplicate text clusters were reported for review; IDs were not removed or rewritten automatically. They are retained where repetition is part of topic practice, subject to future content-diversity work.

## Tutor AI and fallback audit

- English subject metadata remains `Bahasa Inggeris`.
- English question text is preserved as the quoted target.
- Malay coaching is allowed around the English target, but not mixed into the lesson sentence.
- Internal IDs and incomplete prompt fragments are filtered before child-facing output.
- Six fallback paths were exercised by the validator.

## Responsive/CSS audit

Existing UI, overflow and release-candidate audits pass. No new clipping or line-clamp regression was found. Manual device testing is still required for final release sign-off.

## Validation results

- `englishDeepContentAudit.mjs`: PASS
- `englishContentQualityAudit.mjs`: PASS
- BM, guided learning, Tutor modal, AI context, dashboard, UI and RC audits: PASS
- Production build: PASS

## Remaining limitations

- The language classifier uses a controlled Year 2 vocabulary list and should be extended when new lesson vocabulary is approved.
- Duplicate clusters are reported, not deleted, to preserve IDs and learning coverage.
- Manual review of the requested question samples and physical device sizes remains outstanding.

Recommended commit:

`fix(english): remove Malay contamination and repair incomplete questions`
