# Jannati AI Tutor V2.0 Sprint 6 Report

## Goal

Create an offline/browser-based Speaking Coach with no paid API.

## Files Modified

- `src/App.jsx`
  - Added Speaking Coach screen.
  - Added BM, English, and Arabic speaking prompt sets.
  - Added four speaking question types:
    - Introduce yourself
    - Describe picture/text prompt
    - Answer simple question
    - Repeat sentence
  - Added browser `SpeechRecognition` / `webkitSpeechRecognition` support.
  - Added manual transcript fallback.
  - Added keyword checking and speaking score calculation.
  - Added Dashboard Speaking Progress.
  - Added Parent Dashboard Speaking History.
- `src/ai/memoryEngine.js`
  - Added `speakingHistory` to AI Memory.
  - Added `saveSpeakingMemory()` for speaking results.
- `src/styles/style.css`
  - Added Speaking Coach and Speaking Progress styling.
- `V2_SPRINT6_REPORT.md`
  - Added this implementation report.

## Logic Used

Speaking Coach is offline/browser-based:

- Uses browser `SpeechRecognition` or `webkitSpeechRecognition` when available.
- Falls back to manual transcript input if speech recognition is unsupported.
- Uses no paid API.

Scoring:

- Each prompt defines required keywords.
- The transcript is normalized before comparison.
- Score is based on matched required keywords plus a small response-length bonus.
- Matched and missed keywords are highlighted for feedback.

Saved result includes:

- language
- prompt set title
- mode
- score
- matched keyword count
- total keyword count
- transcript
- date

Parent Dashboard shows safe summary fields only:

- date
- title
- language
- score
- matched / total keywords
- mode

## Future Improvements

- Add fluency timing and words-per-minute speaking metrics.
- Add pronunciation confidence when browser APIs expose alternatives.
- Add teacher-defined keyword rubrics.
- Add richer visual prompts for describe-picture mode.
- Add speaking streak and speaking-specific badges.
