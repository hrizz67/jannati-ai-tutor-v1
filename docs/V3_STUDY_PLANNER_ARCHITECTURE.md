# V3 Study Planner Architecture

## Architecture

- Adaptive Learning signals weak topics and mastery levels.
- Parent Insights supplies weakest subjects, focus topics, and revision summaries.
- Revision Schedule supplies overdue and upcoming review items.
- Study Planner Service combines read-only signals into a daily and weekly plan.
- Planner Controller normalizes the final payload for future UI integration.

## Data Sources

- weakest subjects
- focus topics
- recommendationKey
- mastery values
- overdue reviews
- upcoming reviews
- recent activity
- available study time

## Priority Rules

1. overdue revision
2. mastery below 60
3. recommendationKey = review
4. upcoming revision
5. normal practice
6. increase difficulty

Priority output: high / medium / low.

## Duration Rules

- Supported durations: 10, 15, 20, 30, 45, 60 minutes
- Weekday default: 20 minutes
- Weekend default: 30 minutes
- Durations are clamped to 5-60 minutes and never return NaN

## Onboarding Behaviour

- Brand-new students receive a starter plan.
- No fake weakness or revision is fabricated.
- Starter examples include Mathematics basics and Bahasa Melayu reading.

## Future UI Integration

- Daily plan card
- Weekly calendar view
- Parent-friendly summary section

## Limitations

- The planner is read-only and does not change mastery or scoring.
- Subject balance is heuristic and intentionally lightweight.
- It prefers safe, bounded study blocks over aggressive optimization.

## Validation Snapshot

- Scenarios tested: 7
- Average latency: 71.16 ms
- Weekly plan days: 7
- Subject repetition guard: PASS
- Duration allocation: PASS

## Scenario Results

| Scenario | Latency (ms) | Daily Blocks | Weekly Days | Onboarding |
| --- | ---: | ---: | ---: | --- |
| complete profile | 379.19 | 3 | 7 | No |
| weak student | 35.67 | 2 | 7 | No |
| strong student | 16.4 | 4 | 7 | No |
| overdue revisions | 8.52 | 3 | 7 | No |
| sparse profile | 43.84 | 1 | 7 | No |
| empty profile | 9.64 | 2 | 7 | Yes |
| malformed data | 4.88 | 1 | 7 | No |

## Daily Plan Examples

| Scenario | First Block |
| --- | --- |
| complete profile | English - verbs |
| weak student | Bahasa Melayu - penjodoh_bilangan |
| strong student | Matematik - tambah |
| overdue revisions | Bahasa Arab - mufradat |
| sparse profile | Bahasa Melayu - kata_nama |
| empty profile | Matematik - Mathematics basics |
| malformed data | Matematik - tambah |

## Weekly Plan Summary

- Seven-day plan generated successfully.
- Subject repetition guard limited long consecutive runs.
- Lighter days were included for balance.
