# V3.1 Stage 5 Planning, Labels & Recommendation Report

Date: July 26, 2026

## Executive Summary

Stage 5 is complete for the requested runtime scope:

- weekly plan mobile behavior
- review queue deduplication
- canonical planning/recommendation labels
- cross-subject recommendation clarity
- resume card subject accuracy
- Stage 5 copy polish
- compact mobile density for planning surfaces

All required validators passed, including the new Stage 5 validator. Build passed. `dist/index.html` content was restored from `HEAD` after the build.

## Root Causes

1. Weekly plan was still visually heavy on mobile because every day rendered with large card-like spacing and no compact summary row.
2. Review queue metadata repeated overdue/date signals across multiple lines.
3. Several surfaces still rendered raw or awkward labels such as unformatted durations, fallback state labels, and streak phrasing.
4. Cross-subject recommendations did not clearly show target-subject context.
5. Resume cards showed subject-only context but not enough topic/mode accuracy for mixed-subject recovery flows.
6. CTA ordering was not explicitly proving subject selection before lesson launch in adaptive/resume flows.

## Exact Files Modified

- [src/App.jsx](</C:/Project/jannati-ai-tutor-v1/src/App.jsx>)
- [src/utils/displayFormatter.js](</C:/Project/jannati-ai-tutor-v1/src/utils/displayFormatter.js>)
- [src/components/studyPlanner/StudyPlannerPanel.jsx](</C:/Project/jannati-ai-tutor-v1/src/components/studyPlanner/StudyPlannerPanel.jsx>)
- [src/components/studyPlanner/WeeklyPlanList.jsx](</C:/Project/jannati-ai-tutor-v1/src/components/studyPlanner/WeeklyPlanList.jsx>)
- [src/dashboard/HomeDashboard.jsx](</C:/Project/jannati-ai-tutor-v1/src/dashboard/HomeDashboard.jsx>)
- [src/dashboard/RevisionDashboard.jsx](</C:/Project/jannati-ai-tutor-v1/src/dashboard/RevisionDashboard.jsx>)
- [src/dashboard/ParentDashboard.jsx](</C:/Project/jannati-ai-tutor-v1/src/dashboard/ParentDashboard.jsx>)
- [src/dashboard/StudentDashboard.jsx](</C:/Project/jannati-ai-tutor-v1/src/dashboard/StudentDashboard.jsx>)
- [src/dashboard/AnalyticsDashboard.jsx](</C:/Project/jannati-ai-tutor-v1/src/dashboard/AnalyticsDashboard.jsx>)
- [src/styles/style.css](</C:/Project/jannati-ai-tutor-v1/src/styles/style.css>)
- [scripts/validate/v31Stage3CoachUasaAudit.mjs](</C:/Project/jannati-ai-tutor-v1/scripts/validate/v31Stage3CoachUasaAudit.mjs>)
- [scripts/validate/v31Stage5PlanningLabelsAudit.mjs](</C:/Project/jannati-ai-tutor-v1/scripts/validate/v31Stage5PlanningLabelsAudit.mjs>)

## Verification Matrix

| Area | Scenario | Status | Evidence | Remaining manual check |
| --- | --- | --- | --- | --- |
| Weekly plan | Today expanded by default | PASS | `WeeklyPlanList.jsx` uses `expandedToday` initialized from local-date `todayDay` | Mobile tap feel on physical iPhone |
| Weekly plan | Other days collapsed by default | PASS | `expandedExtraKey` defaults to empty string | None |
| Weekly plan | Only one non-today day expands | PASS | Toggle stores one `expandedExtraKey` only | None |
| Weekly plan | Compact collapsed row shows day, subjects, minutes, blocks | PASS | `compactState` combines canonical subject list, duration, and block count | Small-screen visual density on 320px |
| Weekly plan | Empty day compact state | PASS | `weekly-plan-empty` renders intentional compact message | None |
| Review queue | Overdue text appears once only | PASS | `formatReviewQueueMeta()` now drives queue meta lines | Real-device wrap check |
| Review queue | Priority text uses Tinggi/Sederhana/Rendah | PASS | `formatPriority()` + `formatReviewQueueMeta()` | None |
| Review queue | No raw percentage priority leak | PASS | Parent/revision queue cards no longer render raw `%` priority | None |
| Formatter coverage | Planner/review/resume/recommendation surfaces use canonical formatter | PASS | Stage 5 validator checks formatter usage across surfaces | None |
| Formatter coverage | Forbidden raw labels absent | PASS | `v31Stage5PlanningLabelsAudit.mjs` raw-label scan passed | Browser rendering spot-check |
| Cross-subject recommendation | Badge only when target differs | PASS | `smartCrossSubject` and `resumeCrossSubject` guard badge rendering | Visual badge tone on device |
| Cross-subject recommendation | CTA switches subject before launch | PASS | `syncSelectedSubjectState()` runs before `startTopic()` in resume/adaptive flows | Full click-through in browser |
| Resume card | True subject and topic shown | PASS | Home and analytics resume cards use `resume.subjectId` and `resume.metadata?.topicTitle` | Manual resume from mixed-subject state |
| Copy polish | “30 minit”, “Mod pengganti”, “Pelan permulaan”, “Keyakinan AI …” | PASS | Updated Stage 5 surfaces use duration/fallback/streak formatters | Human copy review on live UI |
| Mobile density | Compact planner/review spacing at `<=650px` | PASS | Added `.weekly-plan-toggle`, `.weekly-plan-summary`, `.revision-queue-item` mobile rules | Physical iPhone small-screen check |
| Accessibility | Accordion button semantics and `aria-expanded`/`aria-controls` | PASS | `WeeklyPlanList.jsx` button contract and validator assertion | Keyboard walk-through in browser |
| Accessibility | Cross-subject badge not color-only | PASS | Badge is explicit text: “Cadangan lintas subjek” | Screen-reader announcement review |
| Dist restore | `dist/index.html` restored after build | PASS | `git diff --exit-code -- dist/index.html` returned 0 | None |
| Safari/mobile-only items | iPhone Safari keyboard / touch feel | NOT TESTABLE | No real-device evidence in this run | Manual required |

## Weekly Plan Behavior

- Today is expanded automatically from safe local date matching.
- Other days remain collapsed until opened.
- Only one optional day can be expanded at a time.
- Collapsed rows now summarize:
  - day
  - deduplicated subjects
  - total minutes
  - block count
- Expanded panels preserve existing block order and details.

## Review Queue Behavior

- Topic, subject, and compact meta now appear on one clean stack.
- Duplicate overdue phrasing was removed.
- Raw priority percentages were removed from visible cards.
- Long topic names now wrap through shared compact styles.

## Formatter Coverage

Canonical formatter usage now covers:

- weekly planner rows
- planner block metadata
- review queue metadata
- resume mode labels
- resume subject/topic labels
- focus topic labels
- recent activity topic labels
- recommendation minutes/fallback/streak phrasing

## Cross-Subject CTA Ordering

Runtime proof added in `App.jsx`:

- `syncSelectedSubjectState(subject)` runs before `startTopic(...)`
- applied to:
  - adaptive lesson launch
  - resume launch
  - restart resume launch

This gives us deterministic source-order protection for Stage 5.

## Resume Subject Behavior

- Resume mode uses canonical mode labels.
- Resume subject uses the stored resume subject.
- Resume topic uses stored resume topic metadata when available.
- Cross-subject resume sessions show a dedicated “Cadangan lintas subjek” badge.

## Copy Changes

Examples now normalized to natural BM:

- `30 minit`
- `Mod pengganti: Aktif`
- `Pelan permulaan: Ya/Tidak`
- `Keyakinan AI Rendah/Sederhana/Tinggi`
- `Streak: 2 hari`
- `Ulang Kaji`

## Accessibility

- Weekly plan uses button semantics.
- `aria-expanded` and `aria-controls` are present.
- Focus-visible states remain supported through shared button/focus rules.
- Cross-subject state is communicated in text, not color only.

## Validator Output

Passed:

- `v31CoachContextIconAudit.mjs`
- `v3CoachPayloadAudit.mjs`
- `communicationModulesAudit.mjs`
- `audioContentAudit.mjs`
- `v31IphoneAcceptanceRepairAudit.mjs`
- `v31VisualWowSafetyAudit.mjs`
- `v31Stage1MobileShellAudit.mjs`
- `v31Stage2CommunicationAudit.mjs`
- `v31Stage3CoachUasaAudit.mjs`
- `v31Stage4DashboardAnalyticsAudit.mjs`
- `v31Stage5PlanningLabelsAudit.mjs`

## Build and Bundle Size

- Build: PASS
- Main bundle: `dist/assets/index-CkYcv2PE.js`
- Size: `705.58 kB`
- Gzip: `207.76 kB`

## git status --short

Current worktree still contains earlier staged-repair files plus Stage 5 changes. `dist/index.html` is no longer content-diff dirty after restoration.

## git diff --stat

Current overall worktree diff after Stage 5:

- 25 files changed
- 1678 insertions
- 311 deletions

Note: this diff includes pre-existing Stage 1-4 worktree changes, not just Stage 5 deltas.

## dist/index.html Restoration

- Build regenerated `dist/index.html`
- Content was restored from `HEAD`
- Verification: `git diff --exit-code -- dist/index.html` passed

## Remaining Browser / Device Checks

These remain manual-only and were not marked PASS:

- iPhone Safari keyboard behavior
- touch feel on compact weekly accordion rows
- real-device wrap/spacing with very long Malay labels
- screen-reader announcement quality for cross-subject badges
- final visual QA for compact review queue on small devices
