# BM Repair Sprint 2A

## Executive Summary

`Kata Sendi Nama` was diversified across 50 items while preserving every question ID and every original correct answer.

- Items updated: 50
- Readiness score: 78/100
- Main improvement: richer sentence structures and more natural Year 2 contexts
- Main remaining signal: automated `same_answer_pattern_repeated` findings remain because the topic intentionally drills a compact set of core kata sendi nama

## Structure Distribution

### Before

| Structure family | Count |
|---|---:|
| Direct fill-in sentence drill | 10 |
| Dialogue drill | 10 |
| Petikan pendek / passage drill | 10 |
| KBAT drill | 10 |
| UASA drill | 10 |

### After

| Structure family | Count |
|---|---:|
| Isi tempat kosong | 1 |
| Baca situasi | 2 |
| Lengkapkan ayat | 2 |
| Dialog ringkas | 2 |
| Pilih kata sendi nama yang betul | 2 |
| Pilih ayat yang betul / paling natural | 2 |
| Masa / situasi | 6 |
| Naratif terus | 13 |
| Konteks sekolah | 4 |
| Lain-lain variasi konteks | 16 |

## Repetition Reduction

| Metric | Before | After | Change |
|---|---:|---:|---:|
| same_answer_pattern_repeated | 42 | 42 | 0 |
| duplicate_answer_groups | 8 | 8 | 0 |
| duplicate_question_templates | 0 | 0 | 0 |
| exact duplicate question text | 0 | 0 | 0 |

Notes:

- The visible phrasing is now much more varied.
- The automated same-answer heuristic still flags repeated core answer patterns because this topic is a drill set focused on a small group of prepositions.

## Examples

### Before

- `Di bilik belajar, buku itu terletak ________ atas meja.`
- `Dialog di rumah: "Buku itu terletak ________ atas meja," kata kakak. (Latihan 2)`
- `KBAT: Jika buku itu perlu dicari, buku itu terletak ________ atas meja di ruang tamu. (Latihan 4)`

### After

- `Isi tempat kosong: Buku cerita itu disimpan ______ rak buku.`
- `Dialog ringkas: "Hadiah ini diberikan ______ Cikgu Laila," kata Mira.`
- `Pilih ayat yang betul: Buku itu disimpan ______ almari.`

## Remaining Findings

### Critical

- None

### High

- None

### Medium

- None

### Low

- `same_answer_pattern_repeated` on the kata sendi nama drill set (42 findings)

## Final Topic Readiness

**Kata Sendi Nama:** 78/100

The topic is more readable and context-rich now, but the remaining automated repetition signal means it is still not fully free of low-severity pattern reuse.
