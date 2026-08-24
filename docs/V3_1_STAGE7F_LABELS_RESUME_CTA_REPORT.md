# V3.1 Stage 7F — Labels, Resume Identity, and CTA Consistency Report

Date: July 27, 2026

Scope: Stage 7F only

Status gate: PASS

| Issue | Before | After | Verification | Status | Manual check |
| --- | --- | --- | --- | --- | --- |
| Raw numeric review priority | `Lewat 3 hari · Keutamaan 70` | `Lewat 3 hari · Keutamaan Tinggi` | `node scripts/validate/v31Stage7fLabelsResumeCtaAudit.mjs` fixture `reviewQueue` | PASS | Not required |
| Raw resume subject | `BM Bertutur 2` | `Bertutur Bahasa Melayu Tahun 2` | Stage 7F fixture `resumeSubject` | PASS | Recommended on iPhone |
| Raw resume topic | `Bm Intro` | `Pengenalan Bertutur` | Stage 7F fixture `resumeTopic` | PASS | Recommended on iPhone |
| Raw subject-year label | `English Year 2` | `Bahasa Inggeris Tahun 2` | Stage 7F fixture `subjectYear` and `scopeLabel` | PASS | Recommended on iPhone |
| Raw mode labels | `review`, `adaptive`, `uasa` | `Ulang Kaji`, `Latihan Adaptif`, `Simulator UASA` | Stage 7F fixtures `modeReview`, `modeAdaptive`, `modeUasa` | PASS | Not required |
| Empty duration wording | `0s` | `Belum ada masa belajar direkodkan` | Stage 7F fixtures `zeroDuration`, `shortDuration`, `oneMinute`, `twoMinutes` | PASS | Recommended on iPhone |
| Resume cross-subject badge | generic / inconsistent wording | `Sambung lintas subjek` | Home dashboard source + Stage 7F validator | PASS | Recommended on iPhone |
| Recommendation CTA contradiction | `Cuba topik baharu: Haiwan` + `Latih Semula` | `Cuba topik baharu: Haiwan` + `Mula Latihan` | Stage 7F fixture `newTopicCta` and Home runtime mapping | PASS | Recommended on iPhone |
| Resume CTA mismatch | resume label could drift from action | `Sambung Latihan` now routes to `onResume()` when applicable | Home dashboard source + Stage 7F validator | PASS | Recommended on iPhone |
| Shared formatter drift | component-local formatting fragments | canonical formatter in `src/utils/displayFormatter.js` | Stage 7F validator source assertions | PASS | Not required |
| Screenshot capture set | requested PNG captures unavailable in this environment | exact paths documented, marked not captured | Report only | NOT TESTABLE | Human capture required |

## Raw label root causes

1. `displayFormatter.js` handled basic IDs but did not include subject-year aliases, speaking-set aliases, or subject-aware topic overrides.
2. Resume and recommendation cards still stitched display text inline instead of using one canonical formatter path.
3. Numeric review priorities were shown directly rather than being mapped to severity bands.
4. Study-time wording still exposed machine-like values on dashboard surfaces.

## Formatter coverage

Stage 7F extends the shared formatter with these runtime helpers:

- `formatSubjectName()`
- `formatTopicName()`
- `formatModeName()`
- `formatPriority()`
- `formatDuration()`
- `formatResumeTitle()`
- `formatRecommendationCta()`
- `formatScopeLabel()`

Primary mappings now covered:

- `BM Bertutur 2` → `Bertutur Bahasa Melayu Tahun 2`
- `Bm Intro` → `Pengenalan Bertutur` when the resume subject is the BM speaking flow
- `English Year 2` → `Bahasa Inggeris Tahun 2`
- `review` → `Ulang Kaji`
- `adaptive` → `Latihan Adaptif`
- `uasa` → `Simulator UASA`
- priority `>=70` → `Tinggi`
- priority `>=40` → `Sederhana`
- priority `<40` → `Rendah`
- zero/no-evidence duration → `Belum ada masa belajar direkodkan`

## Review priority mapping

Fixture outputs:

- `70` → `Tinggi`
- `54` → `Sederhana`
- `20` → `Rendah`

Canonical review queue wording:

- `Lewat 3 hari · Keutamaan Tinggi`

## Resume subject, topic, and mode

Canonical fixture:

- subject `bm_bertutur_2` → `Bertutur Bahasa Melayu Tahun 2`
- topic `bm_intro` with BM speaking subject → `Pengenalan Bertutur`
- mode `review` → `Ulang Kaji`

Runtime surfaces updated:

- `/src/dashboard/HomeDashboard.jsx`
- `/src/dashboard/AnalyticsDashboard.jsx`

## Cross-subject resume

Home resume card now uses:

- true source subject formatting
- subject-aware topic formatting
- canonical mode formatting
- explicit badge text: `Sambung lintas subjek`

The underlying resume storage schema was left unchanged.

## Recommendation CTA rules

Deterministic CTA outputs now come from the shared formatter:

- new topic → `Mula Latihan`
- weak/review topic → `Latih Semula`
- incomplete matching session → `Sambung Latihan`
- cross-subject target → `Mula <Subjek>`

Example fixture outputs:

- `Cuba topik baharu: Haiwan.` → `Mula Latihan`
- `Ulang Haiwan kerana skor terbaik masih 60%.` → `Latih Semula`
- incomplete session → `Sambung Latihan`
- cross-subject `math` → `Mula Matematik`

## Duration formatting

Canonical outputs:

- `0` seconds → `Belum ada masa belajar direkodkan`
- `30` seconds → `Kurang daripada 1 minit`
- `60` seconds → `1 minit`
- `120` seconds → `2 minit`

## Screenshot paths

Requested but not captured in this environment:

- `artifacts/stage7f/390-review-queue.png`
- `artifacts/stage7f/390-resume-card.png`
- `artifacts/stage7f/390-cross-subject-resume.png`
- `artifacts/stage7f/390-recommendation-new-topic.png`
- `artifacts/stage7f/390-recommendation-review.png`
- `artifacts/stage7f/390-duration-copy.png`

Status: NOT TESTABLE here. Human screenshot capture is still required.

## Validator results

Stage 7F:

- `node scripts/validate/v31Stage7fLabelsResumeCtaAudit.mjs` → PASS

Prior stage validators re-run:

- `node scripts/validate/v31Stage1MobileShellAudit.mjs` → PASS
- `node scripts/validate/v31Stage2CommunicationAudit.mjs` → PASS
- `node scripts/validate/v31Stage3CoachUasaAudit.mjs` → PASS
- `node scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs` → PASS
- `node scripts/validate/v31Stage5PlanningLabelsAudit.mjs` → PASS
- `node scripts/validate/v31Stage6FinalRegressionAudit.mjs` → PASS
- `node scripts/validate/v31Stage7aMobileChromeAudit.mjs` → PASS
- `node scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs` → PASS
- `node scripts/validate/v31Stage7cGamificationConsistencyAudit.mjs` → PASS
- `node scripts/validate/v31Stage7dAiModalAudit.mjs` → PASS
- `node scripts/validate/v31Stage7eAnalyticsTypographyAudit.mjs` → PASS

Build and repo checks:

- `npm run build` → PASS
- `git diff --check` → PASS (LF/CRLF warnings only)
- `git diff --exit-code -- dist/index.html` → PASS after restore
- `git diff --exit-code -- vite-preview.out.log` → PASS

## Bundle sizes

Baseline from Stage 7E:

- main JS: `723.52 kB`
- main CSS: `100.52 kB`

Stage 7F build:

- main JS: `726.23 kB`
- main CSS: `100.52 kB`

Delta:

- JS: `+2.71 kB`
- CSS: `+0.00 kB`

Result: within the allowed `15 kB` JS increase.

## Runtime files modified for Stage 7F

- `/src/utils/displayFormatter.js`
- `/src/dashboard/HomeDashboard.jsx`
- `/src/dashboard/StudentDashboard.jsx`
- `/src/dashboard/ParentDashboard.jsx`
- `/src/dashboard/AnalyticsDashboard.jsx`
- `/src/components/studyPlanner/StudyBlockItem.jsx`
- `/scripts/validate/v31Stage5PlanningLabelsAudit.mjs`
- `/scripts/validate/v31Stage7fLabelsResumeCtaAudit.mjs`

## Git status

This worktree already contains many earlier Stage 1–7E changes. Stage 7F was applied on top of that mixed tree without resetting or discarding prior work.

## Git diff stat

Stage 7F-targeted files:

`6 files changed, 697 insertions(+), 280 deletions(-)`

Targeted diff scope:

- `src/utils/displayFormatter.js`
- `src/dashboard/HomeDashboard.jsx`
- `src/dashboard/StudentDashboard.jsx`
- `src/dashboard/ParentDashboard.jsx`
- `src/dashboard/AnalyticsDashboard.jsx`
- `src/components/studyPlanner/StudyBlockItem.jsx`

## Remaining real-iPhone checks

Still requires manual iPhone Safari verification:

- review queue wrapping on 390 px and 393 px widths
- resume card cross-subject badge wrapping
- CTA wording on new-topic vs review recommendations
- long Malay and mixed-language labels with safe-area insets
- any interaction between Stage 7A shell spacing and the updated label lengths

## Stage gate result

Stage 7F gate status: PASS

No Stage 7F FAIL remains.
