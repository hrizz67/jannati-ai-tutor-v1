# Jannati AI Tutor V2.0 Sprint 5 Report

## Goal

Create an offline-first Listening Lab using HTML5 Audio and browser-native playback fallback.

## Files Modified

- `src/App.jsx`
  - Added Listening Lab screen.
  - Added BM, English, and Arabic listening sets.
  - Added four question types:
    - Listen and choose
    - Listen and arrange
    - Listen and spell
    - Listen and answer
  - Added Dashboard Listening Progress.
  - Added Parent Dashboard Listening History.
- `src/ai/memoryEngine.js`
  - Added `listeningHistory` to AI Memory.
  - Added `saveListeningMemory()` for listening scores.
- `src/styles/style.css`
  - Added Listening Lab and Listening Progress styles.
- `V2_SPRINT5_REPORT.md`
  - Added this implementation report.

## Logic Used

The lab is offline-first:

- It includes an HTML5 `<audio>` element for local audio clips.
- When no static audio file is provided, it uses browser `speechSynthesis` to play the listening prompt offline.
- No paid API is used.

Scoring:

- Each question type checks the learner response against an expected answer.
- Mixed lab score is calculated from correct completed modes out of four total modes.
- Listening results are saved into AI Memory as summary records.

Parent Dashboard only shows safe summary fields:

- date
- title
- language
- score
- correct / total
- mode

## Future Improvements

- Add recorded local audio files in `public/audio`.
- Add difficulty levels and longer listening passages.
- Add replay limits for assessment mode.
- Add per-language pronunciation speed controls.
- Add item-by-item listening analytics.
