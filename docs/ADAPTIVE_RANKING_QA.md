# Adaptive Ranking QA

Read-only QA for the adaptive question engine using real subject banks and the current adaptive scorer.

## Scenario 1 — Mathematics

Profile focus:

- weak multiplication (`math / darab`)
- repeated borrowing mistakes (`math / tolak`)
- mastered addition (`math / tambah`)

Candidate scores:

| Question ID | Topic | Score | Weak | Mistake | Confidence | Revision | Recent Penalty | Repeat Penalty | Mastered Penalty | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `MATH-DARAB-001` | Darab | 100 | 40 | 35 | 25 | 15 | -30 | -40 | -50 | Selected |
| `MATH-DARAB-002` | Darab | 100 | 40 | 35 | 25 | 15 | -30 | 0 | -50 |  |
| `MATH-TOLAK-001` | Tolak | 100 | 40 | 35 | 20 | 15 | 0 | 0 | -50 |  |
| `MATH-TAMBAH-001` | Tambah | 50 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |

Selection result:

- Selected question: `MATH-DARAB-001`
- Selection reason: `Elakkan soalan ini buat seketika dan cuba topik lain.`
- Confidence influence: strong on multiplication (`+25`)
- Mistake influence: strong repeated-mistake boost (`+35`)
- Revision influence: present (`+15`)

QA note:

- Weak multiplication ranked above mastered addition.
- Recently answered penalties were present, but the weak-topic stack can still saturate at 100, which leaves tie-breaking to deterministic ordering when several weak questions are similarly strong.

## Scenario 2 — Bahasa Melayu

Profile focus:

- weak penjodoh bilangan (`bm / penjodoh_bilangan`)
- grammar mistakes (`bm / tatabahasa`)

Candidate scores:

| Question ID | Topic | Score | Weak | Mistake | Confidence | Revision | Recent Penalty | Repeat Penalty | Mastered Penalty | Result |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `BM-PENJODOH_BILANGAN-001` | Penjodoh Bilangan | 100 | 40 | 35 | 20 | 15 | -30 | -40 | -50 | Selected |
| `BM-KATA_KERJA-001` | Kata Kerja | 58 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |
| `BM-TATABAHASA-001` | Tatabahasa | 58 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |

Selection result:

- Selected question: `BM-PENJODOH_BILANGAN-001`
- Selection reason: `Elakkan soalan ini buat seketika dan cuba topik lain.`
- Confidence influence: low confidence on penjodoh bilangan (`+20`)
- Mistake influence: grammar-related repeated mistakes (`+35`)
- Revision influence: present (`+15`)

QA note:

- Weak topic ranking behaved correctly: penjodoh bilangan outranked the mastered topic.
- Grammar-related competition remained below the weak target.

## Scenario 3 — English

Topic used as the subject-verb agreement proxy:

- `english / verbs`

Candidate scores:

| Question ID | Topic | Score | Weak | Mistake | Confidence | Revision | Recent Penalty | Repeat Penalty | Mastered Penalty | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `ENG-VERBS-001` | Verbs | 95 | 40 | 35 | 20 | 15 | -30 | -40 | -50 | Selected |
| `ENG-NOUNS-001` | Nouns | 56 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |
| `ENG-SENTENCES-001` | Simple Sentences | 56 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |

Selection result:

- Selected question: `ENG-VERBS-001`
- Selection reason: `Elakkan soalan ini buat seketika dan cuba topik lain.`
- Confidence influence: visible through the low-confidence boost on verbs (`+20`)
- Mistake influence: subject-verb mistake context boosted verbs (`+35`)
- Revision influence: present (`+15`)

QA note:

- The best available English proxy topic (`verbs`) outranked mastered nouns and the medium-strength sentence item.

## Scenario 4 — Science

Profile focus:

- plant misconceptions (`sains / tumbuhan`)

Candidate scores:

| Question ID | Topic | Score | Weak | Mistake | Confidence | Revision | Recent Penalty | Repeat Penalty | Mastered Penalty | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `SAINS-TUMBUHAN-001` | Tumbuhan | 100 | 40 | 35 | 25 | 15 | -30 | -40 | -50 | Selected |
| `SAINS-BUMI-001` | Bumi | 62 | 40 | 35 | 6 | 15 | 0 | 0 | -50 |  |
| `SAINS-HAIWAN-001` | Haiwan | 56 | 40 | 35 | 0 | 15 | 0 | 0 | -50 |  |

Selection result:

- Selected question: `SAINS-TUMBUHAN-001`
- Selection reason: `Elakkan soalan ini buat seketika dan cuba topik lain.`
- Confidence influence: strong on tumbuhan (`+25`)
- Mistake influence: plant misconception context boosted tumbuhan (`+35`)
- Revision influence: present (`+15`)

## Penalty Control

A controlled math probe isolated the recent-answer effect:

| State | Question ID | Score | Recent Penalty | Repeat Penalty | Reason |
| --- | --- | ---: | ---: | ---: | --- |
| Fresh | `MATH-DARAB-001` | 52 | 0 | 0 | `Latih Darab kerana kesilapan berulang masih dikesan.` |
| Recently answered | `MATH-DARAB-001` | 42 | -30 | -40 | `Elakkan soalan ini buat seketika dan cuba topik lain.` |

QA conclusion:

- Recently answered questions do receive penalties.
- The fallback helper remains safe: empty input returns `null` instead of crashing.

## Overall QA Findings

- Weak topics ranked above mastered topics in all four subject probes.
- Repeated mistakes increased priority in all four probes.
- Mastered topics were demoted and did not dominate the top of the ranking.
- Recently answered penalties were verified with a controlled before/after probe.
- Fallback safety is intact for empty input.

## Caveat

The current scorer can saturate at `100` when multiple weak-topic signals stack together. That keeps the ranking deterministic, but it can also create ties between several weak candidates in the same topic cluster.
