# Jannati AI Tutor V2.0 Sprint 3 Report

## Files Modified

- `src/ai/adaptive/curriculumGraph.js`
  - Added curriculum prerequisite definitions and default sequential topic dependencies.
- `src/ai/adaptive/knowledgeGraph.js`
  - Added graph node/edge helpers, prerequisite checks, blocked-topic detection, and dependency arrow helpers.
- `src/ai/adaptive/lessonPlanner.js`
  - Added personalised lesson planning output:
    - `todayLesson`
    - `nextLesson`
    - `blockedTopics`
    - `recommendedReview`
    - `reason`
- `src/ai/adaptiveEngine.js`
  - Updated recommendations to skip blocked topics and respect prerequisite mastery.
- `src/App.jsx`
  - Added Dashboard “Today's Learning Journey”.
  - Routed quick-start learning through the lesson planner.
  - Updated Learning Path to lock by graph prerequisites and show dependency arrows.
- `src/styles/style.css`
  - Added journey-card and dependency-arrow styling.
- `V2_SPRINT3_REPORT.md`
  - Added this Sprint 3 implementation report.

## Logic Used

Sprint 3 adds a curriculum knowledge graph above the Sprint 2 mastery engine.

Each topic can declare prerequisites. If no custom prerequisite is defined, the app uses the subject's natural topic order as a safe default. Bahasa Melayu includes an explicit chain aligned with the Sprint example:

`Kata Nama Am -> Kata Nama Khas -> Kata Ganti Nama -> Kata Kerja -> Ayat -> Pemahaman dan Penulisan`

Unlock logic:

- A topic is unlocked only when all prerequisite topics have `MASTERED` status.
- Blocked topics are listed with their missing prerequisites.
- Adaptive recommendations filter out blocked topics.
- Learning Path clicks on locked topics show the prerequisite that must be mastered first.

Lesson planning:

- `NEEDS_PRACTICE` topics are prioritised.
- `LEARNING` topics come next.
- `NOT_STARTED` topics are suggested only when prerequisites are clear.
- `MASTERED` topics move into review instead of replacing active learning.

The Dashboard now shows a journey rather than a single next lesson:

- Today
- Next
- Review
- Blocked topic count
- Reason explaining why the topic was chosen

## Future Improvements

- Add visual graph view for parents and teachers.
- Add cross-subject prerequisite links, such as reading comprehension before long word problems.
- Use `nextReviewDate` from mastery to schedule review sessions more precisely.
- Add teacher-editable prerequisite rules.
- Add difficulty bands inside each topic, not only topic-level dependencies.
