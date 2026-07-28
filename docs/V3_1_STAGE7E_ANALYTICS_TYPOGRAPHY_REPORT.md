# V3.1 Stage 7E — Analytics / Parent Typography, Metric Labels, Curriculum Coverage and No-Data States

## Summary

Stage 7E is complete for the requested runtime scope.

- Stage 7E validator: PASS
- Inherited Stage 7A / Stage 4 / iPhone acceptance validators: PASS
- Build: PASS
- `git diff --check`: PASS

Bundle comparison against the Stage 7D baseline:

- Main JS before: 721.69 kB
- Main JS after: 723.52 kB
- JS delta: +1.83 kB
- Main CSS before: 96.57 kB
- Main CSS after: 100.52 kB
- CSS delta: +3.95 kB

The JS delta stays well under the allowed +15 kB budget.

## Surface matrix

| Surface/issue | Before | Fix | Evidence | Status | Manual check |
| --- | --- | --- | --- | --- | --- |
| Parent metric typography at 390px | Values and labels could dominate narrow cards | Added responsive value/label/subtitle sizing and removed fixed mobile card heights | `scripts/validate/v31Stage7eAnalyticsTypographyAudit.mjs` | PASS | Real iPhone Safari still recommended |
| Long Malay names/statuses wrapping by character | `overflow-wrap:anywhere` and tight card sizing forced awkward breaks | Switched Stage 7E card/list text to `overflow-wrap: break-word`, `word-break: normal`, `hyphens: auto` | Stage 7E validator | PASS | Real device still recommended |
| Parent / Analytics cards showing detached percentages | Labels were visually weaker than values | `MetricCard` now normalizes unknown values, exposes label/value/subtitle consistently, and keeps label semantics explicit | Stage 7E validator + runtime component update | PASS | Real device still recommended |
| Low-contrast label text on light cards | Some secondary text was too pale | Darkened metric/report/timeline supporting text using existing design tokens/colors | Stage 7E validator | PASS | Real device contrast still recommended |
| DSKP no-mapping state | Could show misleading zero cards | Added shared curriculum coverage state helper with `no-mapping` message and no metric cards | Stage 7E validator fixtures | PASS | Optional visual spot-check |
| DSKP mapping-without-evidence state | Could show misleading zero cards | Added `no-evidence` message and suppressed zero metric grid | Stage 7E validator fixtures | PASS | Optional visual spot-check |
| Genuine measured zero | Risk of being treated like missing data | Preserved evidence-backed `0%` in shared curriculum state contract | Stage 7E validator fixtures | PASS | Optional visual spot-check |
| Partial mapping + evidence | Unclear reliability | Added explicit `partial` state with reliable mapped metrics only and explanatory copy | Stage 7E validator fixtures | PASS | Optional visual spot-check |
| Parent focus summary dash cards | `-` placeholders could appear in metric cards | Replaced dash-only fallbacks with `Belum tersedia` / section empty state | Stage 7E validator + `ParentDashboard.jsx` | PASS | Optional |
| Parent focus / timeline / topic rows too loose on mobile | Cards used too much vertical space and wrapped poorly | Tightened mobile spacing, stacked parent topic rows, reduced oversized value scale | CSS runtime update | PASS | Real device still recommended |
| Home DSKP copy contract | Earlier validators expected legacy copy literal | Preserved exact no-mapping copy while routing runtime through the shared helper | Inherited iPhone acceptance validator | PASS | No |

## Typography root cause

The live iPhone symptoms came from three combined causes:

1. mobile metric/report cards still inherited desktop-heavy value sizing,
2. several dashboard blocks kept fixed `min-height` on narrow screens,
3. normal Malay text was still subject to `overflow-wrap:anywhere`.

Stage 7E fixes this with a restrained mobile clamp scale and natural-flow cards:

- metric value: `clamp(1.35rem, 7vw, 2rem)`
- metric label: `clamp(0.85rem, 3.7vw, 1rem)`
- section/report title: `clamp(1rem, 4.8vw, 1.3rem)`

## Wrap root cause

The arbitrary splitting seen in names/statuses/topics came from broad wrapping rules like `overflow-wrap:anywhere` combined with narrow/fixed card boxes.

Stage 7E overrides the affected analytics/parent text surfaces to use:

- `white-space: normal`
- `overflow-wrap: break-word`
- `word-break: normal`
- `hyphens: auto`

## Metric label issue

`MetricCard` now provides a predictable display contract:

- explicit label
- explicit value
- optional subtitle
- normalized unknown value as `Belum tersedia`
- grouped accessibility text via `aria-label`

This keeps percentages and labels visibly paired instead of rendering a lone `%` number with faint surrounding context.

## Contrast fixes

Stage 7E keeps the existing palette but raises readability on light cards by using darker text for:

- `.metric-card-label`
- `.metric-card-subtitle`
- `.report-box` supporting text
- `.timeline-item` supporting text
- `.parent-topic-item` supporting text
- `.curriculum-coverage-state`

## Parent mobile layout

Runtime updates applied:

- no fixed mobile metric-card height
- tighter mobile gaps
- smaller but still readable metric values
- parent topic rows stacked compactly
- dash-only placeholders removed from focus summary

## Analytics mobile layout

Runtime updates applied:

- shared `MetricCard` label/value rendering
- one intentional curriculum empty state
- shared DSKP state contract for:
  - `available`
  - `partial`
  - `no-evidence`
  - `no-mapping`

Canonical analytics calculations were not changed.

## DSKP state contract

Shared helper: `getCurriculumCoverageState(summary)`

Returned shape:

```js
{
  hasMapping,
  hasEvidence,
  hasMeasuredZero,
  state,
  title,
  message,
  metrics
}
```

Supported states:

- `available`
- `partial`
- `no-evidence`
- `no-mapping`

## Fixtures covered

The Stage 7E validator executes real fixtures for:

- full mapping + learner evidence
- partial mapping + learner evidence
- mapping exists but no learner evidence
- no mapping available
- genuine measured zero

## Screenshots / local visual proof

Reliable local browser screenshots were not available in this environment.

Current artifact:

- [SCREENSHOT_STATUS.md](/C:/Project/jannati-ai-tutor-v1/artifacts/stage7e/SCREENSHOT_STATUS.md)

Status for screenshot-specific proof remains `PARTIAL`, with exact manual checks listed there.

## Validators run

Primary:

- `node scripts/validate/v31Stage7eAnalyticsTypographyAudit.mjs`

Inherited regressions rechecked:

- `node scripts/validate/v31Stage7aMobileChromeAudit.mjs`
- `node scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`
- `node scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs`
- `node scripts/validate/v31Stage6FinalRegressionAudit.mjs`
- `npm run build`

## Runtime files modified for Stage 7E

- [src/components/MetricCard.jsx](/C:/Project/jannati-ai-tutor-v1/src/components/MetricCard.jsx)
- [src/curriculum/coverageEngine.js](/C:/Project/jannati-ai-tutor-v1/src/curriculum/coverageEngine.js)
- [src/curriculum/curriculumEngine.js](/C:/Project/jannati-ai-tutor-v1/src/curriculum/curriculumEngine.js)
- [src/curriculum/skspEngine.js](/C:/Project/jannati-ai-tutor-v1/src/curriculum/skspEngine.js)
- [src/dashboard/AnalyticsDashboard.jsx](/C:/Project/jannati-ai-tutor-v1/src/dashboard/AnalyticsDashboard.jsx)
- [src/dashboard/HomeDashboard.jsx](/C:/Project/jannati-ai-tutor-v1/src/dashboard/HomeDashboard.jsx)
- [src/dashboard/ParentDashboard.jsx](/C:/Project/jannati-ai-tutor-v1/src/dashboard/ParentDashboard.jsx)
- [src/styles/style.css](/C:/Project/jannati-ai-tutor-v1/src/styles/style.css)
- [scripts/validate/v31Stage7eAnalyticsTypographyAudit.mjs](/C:/Project/jannati-ai-tutor-v1/scripts/validate/v31Stage7eAnalyticsTypographyAudit.mjs)

## Git status

This worktree already contained many prior-stage changes before Stage 7E resumed. Stage 7E was added on top of that mixed worktree without resetting or discarding any existing edits.

## Git diff stat

Current overall worktree diff stat at completion:

`34 files changed, 3637 insertions(+), 758 deletions(-)`

## Remaining real-iPhone checks

These remain manual-required and are not claimed as device-verified:

- 390×844 and 393×852 Parent Dashboard typography
- 390×844 Analytics card label/value pairing
- Safari light-mode contrast confirmation
- DSKP no-mapping and no-evidence visual compactness
- long learner name wrapping on real iPhone Safari
- long topic/status wrapping on real iPhone Safari

## Stage gate result

Stage 7E gate outcome: PASS

No Stage 7E FAIL remains.
