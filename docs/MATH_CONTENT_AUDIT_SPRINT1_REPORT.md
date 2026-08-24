# Mathematics Content Audit Sprint 1

## Summary

This is a read-only audit of the Year 2 Mathematics question bank focused on:

- `ambiguous_operation`
- `missing_unit`
- `missing_instruction`

The current validator output shows that Mathematics still has several content-quality concerns, especially in operation clarity and unit usage. No question content was modified in this audit.

## Validation results

- `node scripts/validate/questionBankAuditValidator.js` ✅
- `node scripts/validate/questionRepairValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅
  - Output: `0 errors, 27 warnings, 0 info`

## Issue count by type

| Issue type | Count |
|---|---:|
| ambiguous_operation | 161 |
| missing_unit | 41 |
| missing_instruction | 20 |
| same_answer_pattern_repeated | 373 |

## Affected topics

| Topic | ambiguous_operation | missing_unit | missing_instruction |
|---|---:|---:|---:|
| Nombor Hingga 1000 | 30 | 0 | 20 |
| Tambah | 0 | 8 | 0 |
| Tolak | 7 | 8 | 0 |
| Darab | 19 | 8 | 0 |
| Bahagi | 55 | 8 | 0 |
| Wang | 0 | 0 | 0 |
| Masa dan Waktu | 24 | 2 | 0 |
| Panjang | 22 | 2 | 0 |
| Jisim dan Isi Padu | 4 | 5 | 0 |
| Bentuk 2D dan 3D | 0 | 0 | 0 |

## Priority repair list

### P1 — Highest impact

1. **Bahagi**
   - Highest ambiguous-operation count
   - Strong candidate for clearer wording, operation framing, and unit checks

2. **Darab**
   - High ambiguous-operation count
   - Several repeated patterns that make the operation too predictable

3. **Nombor Hingga 1000**
   - All missing-instruction findings are concentrated here
   - Should be cleaned for clearer direct instruction

4. **Masa dan Waktu**
   - Mixed ambiguous-operation and unit issues
   - Needs stronger time-unit wording

### P2 — Important cleanup

5. **Panjang**
   - Ambiguous operation plus missing unit signals
   - Needs clearer measurement context

6. **Jisim dan Isi Padu**
   - Missing units and some ambiguous wording
   - Good next target after the core arithmetic topics

7. **Tolak**
   - Moderate ambiguous-operation and missing-unit count

8. **Tambah**
   - Mostly missing-unit cleanup

## Recommended cleanup order

1. Bahagi
2. Darab
3. Nombor Hingga 1000
4. Masa dan Waktu
5. Panjang
6. Jisim dan Isi Padu
7. Tolak
8. Tambah

## Audit observations

- The strongest issue cluster is `ambiguous_operation`, especially in the division and multiplication topics.
- Missing units appear mainly in measurement-related topics and a few arithmetic areas.
- Missing instructions are concentrated in `Nombor Hingga 1000`, suggesting some prompts are too short or context-light.
- `same_answer_pattern_repeated` is also high, but it was outside the focus scope for this sprint.

## Readiness assessment

Mathematics content is usable, but not yet clean enough for a focused repair pass without prioritizing the higher-impact topics first.

### Recommended next step

Proceed to a small repair batch that targets:

- clearer division and multiplication prompts
- stronger measurement units
- missing instructions in `Nombor Hingga 1000`

This should give the largest improvement in learner clarity with the least content churn.
