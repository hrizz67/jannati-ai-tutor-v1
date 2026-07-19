# BM Repair Sprint 2B

## Executive Summary

`Tatabahasa` has been repaired with a broader mix of Year 2 grammar practice formats while preserving all question IDs, correct answers, and learning objectives.

- Records updated: 50
- Readiness score: 81/100
- Main improvement: structure variety across completion, dialogue, contextual, and KBAT-style items
- Remaining issue: 37 low-severity `same_answer_pattern_repeated` findings remain because the topic still revisits a small, necessary set of grammar answers

## Structure Distribution

### Before

The original set relied on five repeating drill families:

| Structure family | Count |
|---|---:|
| Direct fill-in / completion | 10 |
| Dialogue drills | 10 |
| Short passage drills | 10 |
| KBAT-style prompts | 10 |
| UASA-style prompts | 10 |

### After

| Structure family | Count |
|---|---:|
| Sentence completion | 2 |
| Identify grammar usage | 1 |
| Choose correct sentence | 3 |
| Dialogue context | 6 |
| Contextual school / daily-life situations | 16 |
| Mixed natural-sentence prompts | 8 |
| KBAT-style prompts | 10 |
| Other lightweight variations | 4 |

## Repetition Metrics

| Metric | Before | After | Change |
|---|---:|---:|---:|
| same_answer_pattern_repeated | 45 | 37 | -8 |
| duplicate_answer_groups | 8 | 12 | +4 |
| duplicate stem groups | 0 | 0 | 0 |

Notes:

- The repetition detector improved, but it still flags this topic because the grammar focus uses a compact set of recurring answers.
- `duplicate_answer_groups` increased because the repaired set now spreads practice across more grammar targets instead of only a few repeated ones.

## Examples

### Before

- `Di rumah, baju seragam adik ________ kemas. Pilihan: sangat/sungguh/amat. (Set Tatabahasa 1)`
- `Dialog di sekolah: "Aiman membawa pensel ___ pemadam," kata cikgu. Pilihan: dan/atau/tetapi. (Set Tatabahasa 12)`
- `UASA: Kami ___ menyiapkan latihan dan kini sedang berehat di kantin.`

### After

- `Lengkapkan ayat: Baju sekolah adik ________ bersih selepas dicuci.`
- `Dialog di bilik darjah: "Saya membawa buku ___ pensel," kata Amin.`
- `KBAT: Setelah semua tugasan siap, kami ___ menyiapkan latihan.`

## Remaining Findings

### Critical

- None

### High

- None

### Medium

- None

### Low

- 37 findings of `same_answer_pattern_repeated`

## Final Topic Readiness

**Tatabahasa:** 81/100

The topic is better balanced and more natural for Year 2 learners. The remaining low-severity signals are acceptable for a drill-heavy grammar topic, but the bank would benefit from another future diversity pass if we want to push the automated score even higher.
