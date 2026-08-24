# Jannati AI Tutor V2.0 Sprint 2 Report

## Files Modified

- `src/ai/adaptive/masteryEngine.js`
  - Added the Mastery Engine with topic-level mastery scoring, status classification, confidence, and review date logic.
- `src/ai/memoryEngine.js`
  - Stores `topicMastery` and `masterySummary` inside existing AI Memory while keeping the older `mastery` field working.
- `src/ai/adaptiveEngine.js`
  - Updated adaptive recommendation scoring to prefer `NEEDS_PRACTICE` topics before `MASTERED` topics.
- `src/App.jsx`
  - Added Dashboard Mastery Summary.
  - Passed mastery data into Learning Path.
  - Updated Learning Path rows to use mastery status, mastery score, and mastery-based labels.
- `src/styles/style.css`
  - Added Mastery Summary styling and mastery status colors for Learning Path.
- `V2_SPRINT2_REPORT.md`
  - Added this Sprint 2 implementation report.

## Logic Used

The Mastery Engine calculates each topic using:

- Accuracy from the latest or best saved topic progress.
- Attempts from stored topic progress.
- Study history from the learner activity log.
- Streak from the learner profile or AI Memory.
- Last lesson match for a small recency signal.
- XP as a light long-term progress signal.

Each topic returns:

```js
{
  masteryLevel,
  masteryScore,
  status,
  nextReviewDate,
  confidence
}
```

Status rules:

- `NOT_STARTED`: no attempts yet.
- `MASTERED`: strong score and enough evidence.
- `NEEDS_PRACTICE`: low accuracy or low mastery score.
- `LEARNING`: attempted and improving, but not mastered yet.

AI Memory now stores a `topicMastery` map keyed by `subjectId_topicId`, plus `masterySummary` totals. The adaptive recommendation engine reads that map and boosts `NEEDS_PRACTICE`, lightly boosts `LEARNING`, and downranks `MASTERED`.

## Future Improvements

- Add spaced-repetition scheduling that actively uses `nextReviewDate`.
- Track per-question mistake history for finer mastery confidence.
- Add mastery trend charts for parents.
- Sync mastery across devices when cloud storage is available.
- Add separate mastery weighting per subject type and question difficulty.
