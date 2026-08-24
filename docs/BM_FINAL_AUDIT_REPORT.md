# BM Final Audit Report

## Executive Summary

Bahasa Melayu Tahun 2 is in strong release shape after the completed repair sprints.

- Overall BM readiness: **89/100**
- Remaining findings are **low severity only**
- No critical, high, or medium issues remain in BM
- The remaining audit signals are concentrated in drill-heavy grammar topics where repeated answer patterns are still expected to some extent

## Overall Statistics

| Metric | Value |
|---|---:|
| Total BM questions | 660 |
| Total BM topics | 14 |
| Overall readiness | 89/100 |
| Highest scoring topic | Kata Ganti Nama / Kata Hubung / Penjodoh Bilangan / Pemahaman dan Penulisan / Ayat Tanya, Seruan dan Perintah | 100 |
| Lowest scoring topic | Kata Sendi Nama | 78 |

## Topic Scores

| Topic | Score | Status |
|---|---:|---|
| Kata Nama Am | 90 | Strong |
| Kata Nama Khas | 80 | Good |
| Kata Ganti Nama | 100 | Excellent |
| Kata Kerja | 80 | Good |
| Kata Adjektif | 80 | Good |
| Kata Sendi Nama | 78 | Needs polish |
| Kata Hubung | 100 | Excellent |
| Penjodoh Bilangan | 100 | Excellent |
| Pemahaman dan Penulisan | 100 | Excellent |
| Ayat Tanya, Seruan dan Perintah | 100 | Excellent |
| Tatabahasa | 81 | Good |
| Bina Ayat | 80 | Good |
| Simpulan Bahasa | 85 | Good |
| UASA/KBAT | 85 | Good |

## Remaining Findings

### Critical

- 0

### High

- 0

### Medium

- 0

### Low

- 318 `same_answer_pattern_repeated` findings

Current low-severity concentration:

| Topic | Findings |
|---|---:|
| Kata Sendi Nama | 42 |
| Kata Nama Khas | 40 |
| Kata Kerja | 40 |
| Kata Adjektif | 40 |
| Tatabahasa | 37 |
| Bina Ayat | 32 |
| UASA/KBAT | 28 |
| Simpulan Bahasa | 27 |
| Kata Nama Am | 20 |
| Pemahaman dan Penulisan | 12 |

## Diversity Analysis

### Question diversity

Question structures are now more varied across the repaired BM topics, especially in:

- Pemahaman dan Penulisan
- Penjodoh Bilangan
- Kata Ganti Nama
- Ayat Tanya, Seruan dan Perintah
- Kata Hubung
- Kata Sendi Nama
- Tatabahasa

### Answer diversity

Answer variety is healthy for a Year 2 bank, but compact grammar drills still reuse the same core answers naturally. That is the main reason the low-severity repetition signals remain.

### Context diversity

Context variety improved noticeably after the repair sprints:

- school contexts
- daily-life contexts
- dialogue contexts
- location / movement contexts
- time-based contexts
- sentence-completion and rewrite prompts

### Difficulty balance

The BM bank remains centred on Year 2-level practice, with most remaining issues coming from repetition rather than difficulty imbalance.

## Comparison with Original Audit

| Metric | Original | Current | Improvement |
|---|---:|---:|---:|
| BM readiness score | 86/100 | 89/100 | +3 points (+3.5%) |
| `same_answer_pattern_repeated` findings | 653 | 318 | -335 (-51.3%) |
| High / Medium findings | 0 | 0 | No regression |
| Low findings | 653 | 318 | -335 (-51.3%) |

## Comparison with Interim Audit Sprint 2

| Metric | Interim | Current | Improvement |
|---|---:|---:|---:|
| BM readiness score | 87/100 | 89/100 | +2 points (+2.3%) |
| `same_answer_pattern_repeated` findings | 358 | 318 | -40 (-11.2%) |
| High / Medium findings | 0 | 0 | No regression |
| Low findings | 358 | 318 | -40 (-11.2%) |

## Improvement Statistics

- Overall BM issue reduction vs original audit: **51.3%**
- Overall BM issue reduction vs interim audit: **11.2%**
- Remaining issues are all low severity and largely expected for drill-style grammar topics

## Recommended Remaining Work

1. Optional future polish on `Kata Sendi Nama` if we want to chase the automated repetition heuristic further.
2. Optional future polish on `Tatabahasa`, `Kata Nama Khas`, `Kata Kerja`, and `Kata Adjektif` for additional structural variety.
3. No blocking content repair is required before release.

## Final Verdict

**Overall BM readiness:** 89/100

**Production recommendation:** READY WITH MINOR LOW-PRIORITY ISSUES

BM is functionally ready for production, with only low-severity repetition signals remaining in a few drill-heavy topics.
