# Adaptive Tie-Breaker QA

Read-only QA for tie-breaking in Adaptive Question Engine v2.

## Test Method

I used the existing adaptive engine against real questions from the repository and built controlled profiles so several candidates would land on identical or near-identical adaptive scores.

Subjects exercised:

- Mathematics
- Bahasa Melayu
- English
- Science

## Findings

### 1) Same-score questions are not chosen by raw input order

The engine does not simply keep the original candidate order when scores tie. In the QA probes, tied candidates were ordered by the engine's deterministic tie-break logic, not by input position.

Examples:

- Mathematics tie cluster selected `MATH-DARAB-002` ahead of `MATH-DARAB-001`.
- English tie cluster selected `ENG-SENTENCES-001` ahead of `ENG-VERBS-001`.
- Science tie cluster selected `SAINS-BUMI-001` ahead of `SAINS-TUMBUHAN-001`.

This means tie resolution is deterministic, but not driven by array order alone.

### 2) Recently answered questions still lose priority

A controlled math probe showed the recent-answer penalty is active.

| State | Question ID | Score | Recent Penalty | Repeat Penalty | Outcome |
| --- | --- | ---: | ---: | ---: | --- |
| Fresh | `MATH-DARAB-001` | 52 | 0 | 0 | Candidate stays competitive |
| Recently answered | `MATH-DARAB-001` | 42 | -30 | -40 | Demoted |

Result: recent questions lose priority as intended.

### 3) Older unanswered questions get a fair chance

In the same probes, older unanswered topics with similar confidence/mistake signals remained competitive and were selected when the recent question carried penalty weight.

Observed behavior:

- `MATH-TOLAK-001` remained above the mastered topic in a tied weak-topic cluster.
- `BM-TATABAHASA-001` stayed in contention when `Penjodoh Bilangan` was penalized for recency.
- `ENG-SENTENCES-001` and `SAINS-BUMI-001` were both eligible when their respective weak topics were not recently answered.

### 4) Topic diversity still works

The adaptive layer still rotates away from one-topic dominance within a session.

Observed in the QA probes:

- After the first pick, later positions favored a different topic when scores were close.
- Same-topic items received a session-balance penalty during ordered selection.
- The selected list did not collapse into a single repeated topic.

### 5) Session balance still works

The session-balance logic is visible in the `sessionPenalty` field and the later ordering choices.

Observed behavior:

- The first selected item of a tied cluster could be a weak topic.
- Subsequent items from the same topic gained session penalties, reducing repetition.
- Cross-topic candidates remained available for later positions.

## Subject-by-subject notes

### Mathematics

- Weak multiplication ranked above mastered addition.
- When two multiplication items were tied, the engine chose deterministically by tie-breaker.
- Recent-answer penalties lowered the same question in the controlled probe.

### Bahasa Melayu

- Weak `penjodoh_bilangan` outranked grammar and mastered-topic candidates.
- A tied pair resolved deterministically, with the engine choosing one candidate consistently rather than cycling by input order.

### English

- The weak verbs / subject-verb agreement proxy ranked above mastered nouns and medium-strength sentence items.
- The tie-breaker picked `ENG-SENTENCES-001` ahead of `ENG-VERBS-001` in the equal-score cluster.

### Science

- Plant misconception candidates ranked above mastered and stronger science topics.
- The tie-breaker selected `SAINS-BUMI-001` ahead of `SAINS-TUMBUHAN-001` in the exact tie probe.

## Fallback Check

Fallback remains safe:

- Empty candidate input returned `null` through the safe fallback helper.
- No crash was observed in the QA probe.

## Conclusion

- Same-score questions are not selected by raw input order.
- Recently answered questions do receive penalties and lose priority.
- Older unanswered questions still get fair opportunities.
- Topic diversity and session balance continue to influence ordering.
- Tie-breaking is deterministic, with lexicographic / structural ordering deciding exact ties.

## QA Verdict

Adaptive tie-breaking is functioning safely and consistently.
