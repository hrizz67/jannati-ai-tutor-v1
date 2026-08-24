# Arabic Final Quality Audit Report

## Scope

Audited Arabic learning packs after Cleanup Sprints 2A–2E:

- `huruf_hijaiyah`
- `mufradat`
- `ayat_mudah_arab`
- `hiwar`
- `kefahaman_arab`

Validation used for this audit:

- `node scripts/validate/languageQualityValidator.js`
- `node scripts/validate/questionBankAuditValidator.js`
- `node scripts/validate/questionRepairValidator.js`
- `node scripts/validate/questionValidator.js`
- `node scripts/validate/speechRegression.mjs`
- `npm run build`

## Executive Summary

The Arabic cleanup sprints successfully removed the structural scaffolding gaps that previously affected the teaching packs:

- missing Arabic text
- missing Rumi reference
- pronunciation hint gaps
- weak sentence/dialogue breakdown support
- incomplete teaching scaffolding

However, the current Arabic language-quality validator still reports semantic and repetition findings in the packs, concentrated in:

- `Huruf Hijaiyah`
- `Mufradat`
- `Ayat Mudah Arab`
- `Hiwar`
- `Kefahaman Arab`

So the Arabic stream is materially improved, but not fully production-ready if the language-quality validator is the acceptance gate.

## Before Cleanup Findings

Before the 2A–2E cleanup pass, the Arabic learning packs had these recurring issues:

- generic or thin teaching scaffolding
- weak pronunciation support
- missing or inconsistent Rumi reference support
- incomplete reading guidance
- limited word-by-word or sentence-by-sentence support
- repeated structure with little topic-specific teaching depth

This affected the core Year 2 Arabic learning surfaces:

- `Huruf Hijaiyah`
- `Mufradat`
- `Ayat Mudah Arab`
- `Hiwar`
- `Kefahaman Arab`

## After Cleanup Findings

Current `languageQualityValidator` snapshot for Arabic and Jawi content:

- Arabic questions checked: `1606`
- Jawi questions checked: `53`

Current Arabic issue summary:

- `translation_mismatch`: `1409`
- `multiple_possible_answers`: `50`
- `same_answer_pattern_repeated`: `200`

For the five audited Arabic packs, the current remaining findings are:

| Topic | Remaining findings | Breakdown |
|---|---:|---|
| Huruf Hijaiyah | 136 | 100 `translation_mismatch`, 36 `same_answer_pattern_repeated` |
| Mufradat | 150 | 150 `translation_mismatch` |
| Ayat Mudah Arab | 175 | 175 `translation_mismatch` |
| Hiwar | 175 | 175 `translation_mismatch` |
| Kefahaman Arab | 127 | 46 `translation_mismatch`, 81 `same_answer_pattern_repeated` |

Total remaining findings in the five audited packs: `763`

## Issue Reduction Percentage

The structural cleanup goals were fully achieved:

- missing Arabic text support: reduced to `0` reported blockers in the cleaned packs
- missing Rumi reference gaps: reduced to `0` reported blockers in the cleaned packs
- pronunciation hint gaps: reduced to `0` reported blockers in the cleaned packs
- missing teaching support / sentence scaffolding gaps: reduced to `0` reported blockers in the cleaned packs

Reduction for the targeted structural gap class: `100%`

The broader semantic/style findings are not yet fully removed, so the Arabic stream is improved but not fully clean under the language-quality validator.

## Remaining Problems by Topic

### Huruf Hijaiyah

- Remaining semantic mismatch signals: 100
- Remaining repetition signals: 36
- Readiness note: better scaffolded, but validator still wants clearer alignment on some item-level wording.

### Mufradat

- Remaining semantic mismatch signals: 150
- Readiness note: the pack is structurally stronger, but translation alignment still needs another pass.

### Ayat Mudah Arab

- Remaining semantic mismatch signals: 175
- Readiness note: sentence support is much better, but semantic alignment signals remain.

### Hiwar

- Remaining semantic mismatch signals: 175
- Readiness note: dialogue scaffolding improved, but translation alignment still needs review.

### Kefahaman Arab

- Remaining semantic mismatch signals: 46
- Remaining repetition signals: 81
- Readiness note: reading-comprehension scaffolding is improved, but repetition and semantic alignment still need cleanup.

## Validation Results

- `node scripts/validate/languageQualityValidator.js` — PASS
- `node scripts/validate/questionBankAuditValidator.js` — PASS
- `node scripts/validate/questionRepairValidator.js` — PASS
- `node scripts/validate/questionValidator.js` — PASS (`0 errors, 27 warnings, 0 info`)
- `node scripts/validate/speechRegression.mjs` — PASS
- `npm run build` — PASS

## Arabic Readiness Score

**Arabic readiness score: 66 / 100**

Reasoning:

- strong improvement in Arabic teaching scaffolding
- Arabic text support is now much more complete
- pronunciation and reading scaffolds are materially better
- but the current language-quality audit still reports a significant number of translation and repetition findings

## Recommendation

**Not yet fully production-ready** if the language-quality validator is the final gate.

**Recommended next step:** one more focused semantic-language pass on the five audited Arabic packs, with special attention to:

- translation alignment
- repeated wording patterns
- topic-specific sentence shaping
- reduction of repeated template signals

