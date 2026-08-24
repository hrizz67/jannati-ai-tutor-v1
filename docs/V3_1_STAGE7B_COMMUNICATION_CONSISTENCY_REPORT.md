# V3.1 Stage 7B Communication Consistency Report

Date: July 26, 2026

## Partial state found

- `src/utils/communicationResult.js` had already been expanded beyond the original helper, but it did not yet expose the final Stage 7B helper surface.
- `src/App.jsx` already had Bertutur partially repaired:
  - non-assessed microphone states no longer auto-completed;
  - shared score-history logic had started;
  - Mendengar and Menulis were still incomplete.
- `src/dashboard/AnalyticsDashboard.jsx` still rendered misleading zero-metric communication cards when there was no assessed evidence.
- The dedicated Stage 7B validator and report did not yet exist.

## Exact files completed

Runtime:

- `src/utils/communicationResult.js`
- `src/App.jsx`
- `src/dashboard/AnalyticsDashboard.jsx`

Validator/report:

- `scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`
- `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`
- `scripts/validate/v31VisualWowSafetyAudit.mjs`
- `scripts/validate/v31Stage2CommunicationAudit.mjs`
- `scripts/validate/v31Stage6FinalRegressionAudit.mjs`
- `docs/V3_1_STAGE7B_COMMUNICATION_CONSISTENCY_REPORT.md`

## Shared session summary contract

Stage 7B now uses one consistent communication attempt/session model:

```js
{
  state,
  validAttempt,
  completed,
  canAdvance,
  canProceed,
  isAssessed,
  isTechnicalError,
  isEmptyAttempt,
  isPermissionDenied,
  scorePercent,
  completedDelta,
  shouldAppendHistory,
  reason,
  attemptKey
}
```

Final pure helpers now available in `src/utils/communicationResult.js`:

- `normalizeCommunicationAttempt`
- `isAssessedCommunicationAttempt`
- `appendUniqueCommunicationResult`
- `buildCommunicationSessionSummary`
- `filterLegacyInvalidCommunicationRows`

Supporting helpers preserved:

- `normalizeCommunicationResult`
- `sanitizeCommunicationScoreHistory`
- `summarizeCommunicationHistory`

## Dedupe mechanism

- Attempt identity is normalized through `attemptKey`.
- Stage 7B uses `recordCommunicationScore(...)` in `App.jsx`.
- `recordCommunicationScore(...)` now:
  - normalizes the attempt;
  - rejects non-assessed attempts;
  - rejects duplicate `attemptKey`;
  - appends only assessed scores to `scoreHistory`.

## Legacy filtering

- `filterLegacyInvalidCommunicationRows(...)` now excludes:
  - permission-denied rows;
  - empty/blank/no-speech rows;
  - technical-error rows;
  - duplicate legacy rows with the same attempt identity.
- Valid 0% rows remain evidence.
- No destructive migration was introduced.

## Bacaan parity

Verified:

- shared contract used;
- shared history recorder used;
- shared summary helper used;
- empty attempts do not append history;
- valid 0% remains assessed evidence;
- no-data summary card now appears when there is no assessed evidence;
- item identity is explicit (`passageId:sessionIndex`) for same-index language separation.

## Bertutur before / after

Before:

- microphone-denied / no-speech / technical states could still behave like completed flow states.

After:

- permission denied => `Belum dinilai`;
- no assessed history append;
- `completedItems` remains `0`;
- manual transcript remains available;
- denied then valid manual transcript produces exactly one assessed history row;
- session summary uses assessed history only;
- no-data card appears until a real assessed result exists.

## Mendengar before / after

Before:

- used local `completed` and `correctCount`;
- blank answers were non-assessed, but history/session summary was not shared;
- finish/summary logic was separate from the other communication modules;
- no-data analytics behavior was misleading.

After:

- uses shared communication attempt contract;
- valid incorrect `0%` is assessed and recorded once;
- valid correct `100%` is assessed and recorded once;
- blank answer remains non-assessed;
- playback/validation failure remains non-assessed;
- `Seterusnya` requires assessed evidence;
- session summary derives only from assessed `scoreHistory`;
- no raw technical error text is exposed;
- finish payload now includes:
  - `isAssessed`
  - `scoreHistory`
  - `completedItems`
  - `averageScore`
  - `bestScore`
  - `latestPercent`

## Menulis before / after

Before:

- partially wired score history;
- result UI still treated all result objects like scored output;
- summary still depended on raw `scoreHistory.length`;
- no no-data summary card.

After:

- empty/whitespace input remains non-assessed;
- validation failure/technical failure remains non-assessed;
- valid incorrect `0%` is assessed;
- double-submit is deduplicated;
- `Seterusnya` requires assessed evidence;
- result UI now separates:
  - assessed result;
  - `Belum dinilai`;
  - no-result idle state;
- session summary excludes invalid attempts;
- no-data summary card appears until a real assessed result exists.

## Analytics / no-data communication rendering

Updated in `src/dashboard/AnalyticsDashboard.jsx`.

Previous behavior:

- always rendered four communication metric cards:
  - `0% Purata`
  - `0 Sesi`
  - `0% Terkini`
  - `Bahasa Terakhir: -`

Current behavior:

- for Bacaan, Mendengar, Bertutur, Menulis:
  - if `hasEvidence === false`, render one compact no-data card:
    - `Belum ada sesi direkodkan.`
    - `Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.`
  - if a valid assessed `0%` exists, render numeric metrics normally.

## Fixture outputs

From `node scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`:

| Fixture | Result |
|---|---|
| A permission denied only | `completedItems: 0`, `average: null`, no history |
| B empty attempt only | `completedItems: 0`, `average: null`, no history |
| C technical error only | `completedItems: 0`, `average: null`, no history |
| D audio failure only | `completedItems: 0`, `average: null`, no history |
| E valid assessed 0% | `history: [0]`, `completedItems: 1`, `average: 0`, `best: 0` |
| F valid 100% | `history: [100]`, `completedItems: 1`, `average: 100`, `best: 100` |
| G denied then valid manual 100% | exactly one assessed history row |
| H double-submit valid 100% | duplicate ignored, one history row |
| I valid 0 and valid 100 | `completedItems: 2`, `average: 50`, `best: 100` |
| J legacy invalid + valid row | invalid row excluded, valid row retained |

## Validator results

All requested validators passed on July 26, 2026:

- `node scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`
- `node scripts/validate/v31Stage7aMobileChromeAudit.mjs`
- `node scripts/validate/v31BrowserEnvironmentAudit.mjs`
- `node scripts/validate/v31GamificationTextAudit.mjs`
- `node scripts/validate/v31CoachContextIconAudit.mjs`
- `node scripts/validate/v3CoachPayloadAudit.mjs`
- `node scripts/validate/communicationModulesAudit.mjs`
- `node scripts/validate/audioContentAudit.mjs`
- `node scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`
- `node scripts/validate/v31VisualWowSafetyAudit.mjs`
- `node scripts/validate/v31Stage1MobileShellAudit.mjs`
- `node scripts/validate/v31Stage2CommunicationAudit.mjs`
- `node scripts/validate/v31Stage3CoachUasaAudit.mjs`
- `node scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs`
- `node scripts/validate/v31Stage5PlanningLabelsAudit.mjs`
- `node scripts/validate/v31Stage6FinalRegressionAudit.mjs`
- `npm.cmd run build`
- `git diff --check`

## Build size

Latest production build:

- main bundle: `dist/assets/index-C1hNFAw3.js`
- size: `715.91 kB`
- gzip: `209.78 kB`

## Git status --short snapshot

This remains a mixed worktree from earlier stages. Stage 7B did not reset or discard any of it.

Key Stage 7B-relevant files now changed:

- `src/App.jsx`
- `src/utils/communicationResult.js`
- `src/dashboard/AnalyticsDashboard.jsx`
- `scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`
- validator compatibility updates:
  - `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`
  - `scripts/validate/v31VisualWowSafetyAudit.mjs`
  - `scripts/validate/v31Stage2CommunicationAudit.mjs`
  - `scripts/validate/v31Stage6FinalRegressionAudit.mjs`

## Git diff --stat snapshot

Stage 7B-focused diff snapshot:

```text
src/App.jsx                          | 761 +++++++++++++++++++++++++++++------
src/dashboard/AnalyticsDashboard.jsx | 160 ++++----
2 files changed, 714 insertions(+), 207 deletions(-)
```

Additional new file:

- `src/utils/communicationResult.js`
- `scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`

Note: the wider worktree still contains many unrelated modified files from earlier interrupted stages, which were intentionally preserved.

## Remaining real-device checks

Still manual / real-device required:

- microphone permission flow on device;
- Safari/iPhone actual speech recognition behavior;
- audible playback confirmation for Mendengar;
- real-device keyboard overlap / audio interruption scenarios;
- live device verification that non-assessed attempts never create visible historical metrics across persisted sessions.

## Stage gate

Stage 7B is complete against its requested gate:

- Mendengar complete;
- Menulis complete;
- no-data summary complete;
- Stage 7B validator exists and passes;
- previous validators pass;
- build passes;
- invalid attempts record zero completed items;
- valid `0%` remains evidence.
