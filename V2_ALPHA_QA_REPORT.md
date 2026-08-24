# Jannati AI Tutor V2.0 Alpha QA Report

Date: 2026-07-02
Branch: v2.0-dev
Scope: Sprint 9 Regression & Integration QA

## Regression Summary

Status: PASS after scoped QA fixes.

Verified modules:

- Dashboard: PASS. Fresh preview shows Dashboard, stats, AI recommendation, mastery summary, curriculum coverage, all four coach progress cards, subject grid, UASA entry, and Learning Path.
- Subject selection: PASS. Switching to English Year 2 updates the selected subject surface.
- Learning Path: PASS. Topic path renders with mastery state, graph lock state, resume/favourite controls, and start controls.
- Adaptive Learning: PASS. Start Journey opens an adaptive quiz from the recommendation/lesson planner output.
- Mastery Engine: PASS. Dashboard renders topic mastery summary and valid mastery statuses.
- Knowledge Graph: PASS. Dashboard and Learning Path render blocked topic counts / prerequisite state without runtime errors.
- Lesson Planner: PASS. Today's Learning Journey renders today/next/review recommendations.
- AI Explain: PASS. Quiz feedback opens Offline AI Explain modal.
- AI Teacher: PASS. AI Explain opens Offline AI Teacher modal.
- AI Recommendation: PASS. Recommendation card renders from profile/memory and practice action remains available.
- AI Memory: PASS after fix. Quiz and coach saves refresh memory-backed summaries.
- Reading Coach: PASS after fix. Reading saves to AI Memory and now has a Dashboard progress card.
- Listening Lab: PASS. Save flow returns to Dashboard and updates Listening progress.
- Speaking Coach: PASS. Manual transcript save flow returns to Dashboard and updates Speaking progress.
- Writing Coach: PASS. Save flow returns to Dashboard and updates Writing progress.
- Curriculum Engine: PASS. Curriculum coverage renders on Dashboard and Parent Dashboard.
- Parent Dashboard: PASS. Parent reporting renders coach histories, curriculum intelligence, weak/strong topics, UASA history, and activity timeline.
- Teacher Snapshot: PASS after fix. Existing snapshot engine is now surfaced in Parent Dashboard.
- UASA Simulator: PASS. UASA route renders and returns to Dashboard.

## Integration Summary

Verified flow:

Reading / Listening / Speaking / Writing -> AI Memory -> Mastery/Curriculum refresh -> Adaptive Recommendation inputs -> Dashboard.

Fixes made during QA:

- Coach save handlers now save AI Memory after constructing the updated profile, passing current subjects so memory can refresh mastery summary and curriculum coverage immediately.
- Added missing Reading Progress card to Dashboard.
- Added Teacher Snapshot section to Parent Dashboard using the existing `buildTeacherPortalSnapshot` engine.
- Updated browser title and service-worker cache key from V1.5.1 labels to V2.0 Alpha QA to prevent stale V1 cache reuse.

## Data Validation

Validated 8 subjects and 4,000 questions.

- Duplicate subject/topic/question IDs: 0 found.
- Broken question prompts/answers: 0 found.
- Raw missing SK: 4,000 records.
- Raw missing SP: 4,000 records.
- Normalized missing SK/SP after curriculum inference: 0.
- Invalid mastery states: 0.
- Null progress handling: PASS via empty profile/default progress paths.
- Missing timestamps: PASS for new AI Memory coach saves and quiz saves.
- Invalid localStorage handling: PASS for AI Memory load fallback; profile/resume load still depends on valid JSON in existing app behavior.

## Performance Summary

- `npm run dev`: PASS. Vite dev server ready on `http://127.0.0.1:5173/jannati-ai-tutor-v1/` in 2434 ms, no stderr.
- `npm run build`: PASS. Final build completed in 3.40 s.
- Browser smoke test: PASS on fresh preview origin `http://127.0.0.1:4175/jannati-ai-tutor-v1/`.
- Blank screen: None observed.
- Infinite render: None observed.
- Console errors/warnings: None captured in preview navigation sweep.
- React warnings: None captured in preview navigation sweep.

Final build output:

- 44 modules transformed.
- Main JS: `dist/assets/index-C935bWMp.js` 287.69 kB, gzip 84.73 kB.
- CSS: `dist/assets/index-7EjPmda5.css` 30.36 kB, gzip 6.56 kB.
- Subject chunks emitted for BM, Math, English, Sains, Arab, Islam, PJ, and PK.

## Known Issues

- Source question records still rely on inferred SK/SP metadata instead of explicit SK/SP fields in every question. Runtime curriculum coverage is valid after inference.
- V1.5.1 localStorage keys remain intentionally unchanged to preserve existing learner progress and migration compatibility.
- No dedicated automated unit/e2e test suite is present; this Sprint 9 pass used build validation, scripted browser smoke tests, and data-shape validation.

## Files Inspected

- `src/App.jsx`
- `src/ai/memoryEngine.js`
- `src/ai/adaptiveEngine.js`
- `src/ai/adaptive/masteryEngine.js`
- `src/ai/adaptive/knowledgeGraph.js`
- `src/ai/adaptive/lessonPlanner.js`
- `src/ai/recommendationEngine.js`
- `src/ai/explainEngine.js`
- `src/ai/teacherEngine.js`
- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/curriculum/curriculumEngine.js`
- `src/curriculum/coverageEngine.js`
- `src/curriculum/skspEngine.js`
- `src/curriculum/uasaEngine.js`
- `src/data/subjects/index.js`
- `src/data/subjects/*.js`
- `src/styles/style.css`
- `index.html`
- `public/service-worker.js`
- `public/manifest.webmanifest`
- `package.json`
- `vite.config.js`

## Production Readiness

Verdict: V2.0 Alpha is ready for alpha deployment after Sprint 9 QA.

Readiness notes:

- Core V2 modules render and integrate without browser console errors in a fresh production preview.
- Data validation found no duplicate IDs or normalized SK/SP gaps.
- Build is passing.
- Remaining caveats are alpha-level: inferred metadata and lack of automated regression suite.
