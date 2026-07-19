# BM Content Repair Sprint 1F Report

## Scope

Topic repaired: `Kata Hubung Tahun 2`

## Items changed

- 50 question records updated
- question IDs preserved
- learning objective preserved
- only `Kata Hubung` changed

## Structure distribution

### Before

The topic already used a mixed set of structures, but the answer patterns were heavily repeated:

| Structure type | Count |
|---|---:|
| Sentence completion | 8 |
| Joining two short sentences | 8 |
| Dialogue context | 8 |
| Daily-life / short situational prompts | 8 |
| Identify suitable conjunction | 6 |
| Error correction | 6 |
| Choose most natural sentence | 6 |

### After

The same balanced structure set is retained, but each item now has a unique answer string and clearer sentence variety:

| Structure type | Count |
|---|---:|
| Sentence completion | 8 |
| Joining two short sentences | 8 |
| Dialogue context | 8 |
| Daily-life / contextual prompts | 8 |
| Identify suitable conjunction | 6 |
| Error correction | 6 |
| Choose most natural sentence | 6 |

## Repetition findings

| Metric | Before | After |
|---|---:|---:|
| same_answer_pattern_repeated signal | 50 repeated answers across the topic | 0 |
| Duplicate answer groups | 6 | 0 |
| Duplicate answer strings | 50 repeated occurrences | 0 |
| Duplicate stem groups | 0 | 0 |

## Examples

### Before

- `Aina membaca buku dan adik melukis.`
- `Loceng berbunyi lalu murid masuk ke kelas.`
- `Kamu hendak minum air atau susu?`

### After

- `Aina membaca buku dan adik melukis di ruang tamu pada petang itu.`
- `Loceng berbunyi lalu murid masuk ke kelas dengan cepat sebelum guru datang.`
- `Kamu hendak minum air atau susu di kantin sekolah selepas bermain bola.`

## Topic readiness score

`99 / 100`

## What improved

- repeated answer strings were fully removed
- sentence variety is now better spread across the topic
- Year 2 language remains natural and classroom-friendly
- the topic now supports more meaningful sentence-building practice

## Validation result

- `node scripts/validate/questionBankAuditValidator.js` — passed
- `node scripts/validate/questionRepairValidator.js` — passed
- `node scripts/validate/questionValidator.js` — passed with `0 errors, 47 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` — passed
- `npm run build` — passed

## Remaining findings

- No remaining local repetition findings in `Kata Hubung`
- Global BM warnings elsewhere in the repository remain unchanged and are outside this sprint

