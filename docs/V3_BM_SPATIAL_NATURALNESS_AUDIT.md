# V3 Bahasa Melayu Spatial Naturalness Audit

## Executive summary

The third-pass audit adds deterministic checks for noun ownership, part–whole phrases, nested locations, preposition chains, spatial collocations, and animal/action/location compatibility. The source-of-truth path remains the existing BM normalizer; question IDs, scoring, adaptive selection, and UI code were not changed.

Result: **PASS**. All 760 static BM questions and 10,000 deterministic generated samples complete without a remaining high-severity spatial or naturalness issue. The 15 explicit regression sentences are all repaired to a valid sentence before re-validation.

## Root causes addressed

- Broad locations were incorrectly concatenated to part nouns (`dahan taman`, `pokok taman`).
- Part nouns were allowed without a valid owner (`dahan`, `akar`, `bumbung`, `pintu`, `rak`).
- Nested location and preposition chains could be malformed (`di dalam atas meja`, `di hadapan belakang kelas`).
- Action/location combinations could be physically implausible (for example, a fish swimming on a field).
- A generic noun-phrase check could mistake valid compounds such as `beg sekolah` for an invalid ownership relation.

## Registries and rules

`src/utils/bmSentenceQuality.js` now exposes:

- `PART_WHOLE_RELATIONSHIPS` for deterministic ownership (for example, `dahan → pokok`, `roda → basikal`).
- `VALID_BM_COMPOUND_NOUNS` with approved Year 2 compounds including `dahan pokok`, `rak buku`, `halaman sekolah`, and `bilik darjah`.
- `validatePartWholePhrase()` for owner validation.
- `validateNestedLocationPhrase()` for complete location phrases and nested attachment.
- `validateBmPrepositionChain()` for repeated or contradictory prepositions.
- `validateBmNaturalness()` returning semantic, spatial, ownership, and ambiguity findings with severity and confidence.
- Atomic repair through `repairBMSentence()` and `normalizeBMQuestionRecord()` so question text, answer-related context, options, hints, and read-aloud fields stay aligned.

Valid authored compounds such as `bangku taman`, `pagar taman`, `taman permainan`, `pintu sekolah`, and `bumbung sekolah` are explicitly retained.

## Spatial and animal rules

The validator accepts natural collocations such as `hinggap di dahan pokok`, `tidur di atas katil`, `bermain di taman permainan`, and `berenang di dalam kolam`. It rejects or repairs invalid action/location pairs including fish on a field, cats flying, and animals sleeping in a pool. Broad locations remain valid when they are the intended location (`burung terbang di taman`) and are not treated as object owners.

## Audit coverage

| Measure | Result |
| --- | ---: |
| Static BM questions | 760 |
| BM topics | 14 |
| Generated samples | 10,000 |
| Templates/source paths checked | 88 source paths (2 template/question-generator groups) |
| Fallback/generator paths checked | 11 |
| Part–whole pairs in registry | 43 |
| Approved compounds | 23 |
| Distinct location phrases observed | See JSON report |
| Explicit regression cases | 15 |
| Regression cases valid after repair | 15/15 |
| Remaining high-severity issues | 0 |

The machine-readable result is stored at `reports/validation/bm-spatial-naturalness-report.json`.

## Before and after examples

| Before | After |
| --- | --- |
| Burung hinggap di dahan taman. | Burung hinggap di dahan pokok di taman. |
| Burung hinggap di pokok taman. | Burung hinggap di pokok di taman. |
| Ikan berenang di padang sekolah. | Ikan berenang di dalam kolam sekolah. |
| Ali duduk di kerusi kelas meja. | Ali duduk di atas kerusi di dalam kelas. |
| Buku berada di atas kelas. | Buku berada di atas meja di dalam kelas. |
| Murid berdiri di pintu belakang sekolah hadapan. | Murid berdiri di hadapan pintu sekolah. |
| Burung membuat sarang di bumbung pokok. | Burung membuat sarang di atas pokok. |
| Ali berdiri di hadapan belakang kelas. | Ali berdiri di hadapan kelas. |
| Buku berada di dalam atas meja. | Buku berada di atas meja. |
| Kucing tidur di halaman katil. | Kucing tidur di atas katil. |

## Tutor AI and fallback context

BM question records continue to be normalized before they reach Tutor AI context. The atomic record normalizer updates the visible question plus answer, accepted-answer, explanation, hint, and read-aloud strings when a repaired phrase changes. No new UI or runtime logging was introduced. Existing fallback builders continue to use `repairBMSentence()`.

## Manual-review sampling

The automated audit deterministically sampled 50 animal/location examples, 50 kata sendi records, 50 compound-noun records, and representative reading-comprehension and Tutor AI context strings from the full source. A browser/device visual review was not run in this command-line pass; Arabic/English UI rendering remains covered by the existing release-candidate audits.

## Validation results

- `node scripts/validate/bmSpatialNaturalnessAudit.mjs` — **PASS**
- `node scripts/validate/bmFullContentQualityAudit.mjs` — **PASS** (760 static, 5,000 generated, 0 rejected)
- Existing BM sentence-quality audit — **PASS**
- Full release validation chain — run separately as part of handoff; no production behavior was intentionally changed.

## Remaining limitations

- Naturalness is deterministic and rule-based; figurative or newly authored story language may require a future reviewed registry entry.
- This pass does not claim clinical, speech-recognition, or visual UI testing.
- `dist/` is generated output and is not part of the source change.

## Files

- Modified: `src/utils/bmSentenceQuality.js`
- Added: `scripts/validate/bmSpatialNaturalnessAudit.mjs`
- Added: `reports/validation/bm-spatial-naturalness-report.json`
- Added: this report

Recommended commit message: `fix(bm): validate spatial relations and noun ownership`
