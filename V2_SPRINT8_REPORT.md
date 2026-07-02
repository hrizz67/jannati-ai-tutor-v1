# Jannati AI Tutor V2.0 Sprint 8 Report

## Goal

Create Curriculum Intelligence Engine connecting learning data to DSKP and UASA metadata.

## Files Added

- `src/curriculum/curriculumEngine.js`
  - Normalizes every question into curriculum metadata.
  - Builds teacher-portal-ready curriculum snapshots.
- `src/curriculum/skspEngine.js`
  - Infers SK/SP when explicit fields are missing.
  - Estimates question time from difficulty.
- `src/curriculum/coverageEngine.js`
  - Calculates SK/SP coverage and mastery from learner progress.
  - Produces missing SK/SP and topic gap data.
- `src/curriculum/uasaEngine.js`
  - Summarizes UASA metadata and difficulty distribution.
  - Recommends the next missing SK/SP target.

## Files Modified

- `src/App.jsx`
  - Dashboard now shows Curriculum Coverage.
  - Parent Dashboard now shows SK/SP mastery and UASA item count.
  - AI recommendation memory now receives curriculum coverage.
- `src/ai/memoryEngine.js`
  - Stores `curriculumCoverage` in AI Memory.
- `src/ai/adaptiveEngine.js`
  - Recommendations now boost topics linked to missing SK/SP.
- `src/styles/style.css`
  - Added Curriculum Coverage card styling.

## Logic Used

Every question is normalized at runtime with:

- subject
- topic
- SK
- SP
- UASA
- difficulty
- estimated time

If explicit `SK` or `SP` metadata is unavailable, the engine infers stable codes from subject, topic index, and question band.

Coverage logic:

- Topic progress is mapped onto each question in that topic.
- SK/SP coverage is calculated from attempted questions.
- SK/SP mastery is calculated from mastered question groups.
- Missing SK/SP targets are sorted by lowest coverage and mastery.

AI recommendation:

- Missing SK/SP creates topic gaps.
- Adaptive recommendations boost topics linked to those gaps.
- Recommendation reason explains the missing SK/SP target when applicable.

Teacher portal readiness:

- `buildTeacherPortalSnapshot()` produces subject summaries, SK/SP rows, and coverage summary data suitable for a future teacher portal.

## Future Improvements

- Add official SK/SP mappings for every topic instead of inferred defaults.
- Add teacher-editable curriculum tags.
- Add UASA blueprint weighting by section and skill.
- Add export to CSV/PDF for teacher portal reports.
- Track question-level attempts instead of topic-level projection.
