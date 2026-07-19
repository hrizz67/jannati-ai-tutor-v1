# V3 Gamification Architecture

## Architecture

- xpEngine awards XP for correct answers, completed sessions, streak bonuses, perfect scores, and AI-assisted recovery.
- levelEngine converts XP into scalable level progression.
- streakEngine tracks current streak, best streak, and last activity date.
- achievementEngine evaluates metadata-driven achievement definitions.
- rewardSummary normalizes the output for future UI consumption.
- gamificationController coordinates all engines without changing scoring or adaptive logic.

## XP Rules

| Event | XP |
| --- | ---: |
| Correct answer | 10 |
| Completed session | 15 |
| Streak bonus | 5 per bonus unit |
| Perfect score | 20 |
| AI-assisted recovery | 8 |

## Level Formula

- Thresholds grow progressively by 100 XP, then +50 XP for each next level step.
- Progress is clamped between 0 and 100.

## Achievement Model

- First Question
- First Perfect Score
- 7-Day Streak
- 100 Questions
- Math Explorer
- English Reader
- Science Explorer

## Future Seasonal Events Roadmap

- Monthly event badges
- Holiday challenge bonuses
- Subject streak festivals
- Parent-visible celebration summaries

## Validation Snapshot

- Simulated days: 30
- Final XP: 873
- Final level: 5
- Final streak: 12
- Best streak: 12
- Total achievements: 7
- Average simulated latency: 1.436 ms

## Daily Progress Sample

| Day | XP | Level | Streak | Best Streak | Achievements | Latency (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 25 | 1 | 1 | 1 | 5 | 5.544 |
| 2 | 55 | 1 | 2 | 2 | 5 | 1.747 |
| 3 | 75 | 1 | 3 | 3 | 5 | 1.04 |
| 4 | 105 | 2 | 4 | 4 | 5 | 12.523 |
| 5 | 155 | 2 | 5 | 5 | 5 | 0.851 |
| 6 | 175 | 2 | 6 | 6 | 5 | 0.926 |
| 7 | 195 | 2 | 7 | 7 | 6 | 0.664 |
| 8 | 195 | 2 | 7 | 7 | 6 | 0.513 |
| 9 | 225 | 2 | 1 | 7 | 6 | 0.75 |
| 10 | 260 | 3 | 1 | 7 | 6 | 0.703 |
| 11 | 290 | 3 | 2 | 7 | 6 | 7.784 |
| 12 | 340 | 3 | 3 | 7 | 6 | 0.654 |
| 13 | 370 | 3 | 4 | 7 | 6 | 0.661 |
| 14 | 408 | 3 | 5 | 7 | 6 | 0.782 |
| 15 | 438 | 3 | 6 | 7 | 6 | 0.426 |
| 16 | 468 | 4 | 7 | 7 | 6 | 0.508 |
| 17 | 468 | 4 | 7 | 7 | 6 | 0.67 |
| 18 | 488 | 4 | 1 | 7 | 6 | 0.5 |
| 19 | 553 | 4 | 1 | 7 | 6 | 0.639 |
| 20 | 573 | 4 | 2 | 7 | 6 | 0.596 |
| 21 | 603 | 4 | 3 | 7 | 6 | 0.886 |
| 22 | 633 | 4 | 4 | 7 | 6 | 0.449 |
| 23 | 663 | 4 | 5 | 7 | 6 | 0.453 |
| 24 | 693 | 4 | 6 | 7 | 6 | 0.423 |
| 25 | 723 | 5 | 7 | 7 | 6 | 0.428 |
| 26 | 753 | 5 | 8 | 8 | 6 | 0.426 |
| 27 | 783 | 5 | 9 | 9 | 7 | 0.373 |
| 28 | 813 | 5 | 10 | 10 | 7 | 0.389 |
| 29 | 843 | 5 | 11 | 11 | 7 | 0.414 |
| 30 | 873 | 5 | 12 | 12 | 7 | 0.35 |

## Recommendation Distribution

| Bucket | Days |
| --- | ---: |
| level-1-2 | 9 |
| level-3-4 | 15 |
| level-5-plus | 6 |
