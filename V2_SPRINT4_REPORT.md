# Jannati AI Tutor V2.0 Sprint 4 Report

## Goal

Create an offline/browser-based Reading Coach AI using the Web Speech API, with manual fallback and no paid API.

## Files Modified

- `src/App.jsx`
  - Replaced the placeholder Reading Coach with a real offline reading flow.
  - Added BM, English, and Bahasa Arab passages.
  - Added browser `SpeechRecognition` support when available.
  - Added manual transcript fallback when speech recognition is unsupported.
  - Added word comparison, correct/missed/incorrect highlighting, scoring, and result saving.
  - Added safe Reading Coach history to Parent Dashboard.
- `src/ai/memoryEngine.js`
  - Added `readingHistory` to AI Memory.
  - Added `saveReadingMemory()` for Reading Coach results.
- `src/styles/style.css`
  - Added Reading Coach layout, passage, transcript, Arabic RTL, and result styling.
- `V2_SPRINT4_REPORT.md`
  - Added this Sprint 4 implementation report.

## Logic Used

Reading Coach uses browser-native `SpeechRecognition` or `webkitSpeechRecognition` if available.

If unsupported, the learner can type the transcript manually. The app then compares the transcript against the selected passage.

Comparison flow:

- Normalize target and transcript words.
- Remove punctuation and Arabic vowel marks.
- Match spoken words against target words.
- Mark target words as:
  - correct
  - missed
- Count extra spoken words as incorrect.
- Calculate score from correct target words with a small penalty for incorrect extra words.

Supported passages:

- Bahasa Melayu
- English
- Bahasa Arab

Saved result includes:

- language
- passage title
- target text
- transcript
- score
- correct count
- missed count
- incorrect count
- date

Parent Dashboard only shows safe summary data: date, title, language, score, correct words, and missed words.

## Future Improvements

- Add more passages by difficulty level.
- Add per-word pronunciation hints.
- Add fluency timing and words-per-minute scoring.
- Add separate phonics mode for early readers.
- Add browser permission guidance for microphones.
