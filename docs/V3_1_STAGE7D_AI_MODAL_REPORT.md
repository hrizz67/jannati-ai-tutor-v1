# V3.1 Stage 7D AI Modal Report

Status: PARTIAL

Stage scope: Tutor AI, Explain, and Teach modal layout, scrolling, layering, and accessibility only.

This report reflects the current mixed worktree without resetting or discarding any prior Stage 1–7C changes.

## Root causes

1. Tutor AI used a separate modal layout with extra help panels outside the main scroll body.
2. Explain and Teach used lighter dialog wiring than Tutor AI, with weaker focus and scroll handling.
3. Background chrome suppression relied on visual layering and body overflow only, without an inert background contract.
4. Mobile modal behavior depended on multiple historical CSS blocks, making footer/body boundaries fragile on iPhone sizes.

## Files modified for Stage 7D

- [src/components/ai/TutorAIModal.jsx](/C:/Project/jannati-ai-tutor-v1/src/components/ai/TutorAIModal.jsx)
- [src/components/ai/AIExplainModal.jsx](/C:/Project/jannati-ai-tutor-v1/src/components/ai/AIExplainModal.jsx)
- [src/components/ai/AITeacherModal.jsx](/C:/Project/jannati-ai-tutor-v1/src/components/ai/AITeacherModal.jsx)
- [src/components/ai/modalRuntime.js](/C:/Project/jannati-ai-tutor-v1/src/components/ai/modalRuntime.js)
- [src/App.jsx](/C:/Project/jannati-ai-tutor-v1/src/App.jsx)
- [src/styles/style.css](/C:/Project/jannati-ai-tutor-v1/src/styles/style.css)
- [scripts/validate/v31Stage7dAiModalAudit.mjs](/C:/Project/jannati-ai-tutor-v1/scripts/validate/v31Stage7dAiModalAudit.mjs)

Audit-only harness files:

- [artifacts/stage7d/modal-audit.html](/C:/Project/jannati-ai-tutor-v1/artifacts/stage7d/modal-audit.html)
- [artifacts/stage7d/modal-audit.js](/C:/Project/jannati-ai-tutor-v1/artifacts/stage7d/modal-audit.js)

These harness files are not imported from `src/` and are not part of the production entry graph.

## Compatibility table

| Component | Old public prop/behavior | New equivalent | Preserved? |
|---|---|---|---|
| TutorAIModal | Existing public props for subject/topic/question/answer/feedback/profile | Same prop surface retained | PASS |
| TutorAIModal | Loading state and timeout fallback | `loading`, `status`, `error`, timeout fallback retained | PASS |
| TutorAIModal | Quick prompts and analytics prompts | Same prompt sets retained, moved into scroll body | PASS |
| TutorAIModal | Chat history and input state | `messages`, `input`, `sendMessage` preserved | PASS |
| TutorAIModal | Async stale-response guard | `requestIdRef` logic retained | PASS |
| TutorAIModal | Close handler | `onTutup` preserved through shared modal runtime | PASS |
| TutorAIModal | Subject/topic context | Preserved and made explicit in header/context card | PASS |
| AIExplainModal | `open`, `data`, `context`, `question`, `character`, `onTutup`, `onTryAgain`, `onTeach` | Same props retained | PASS |
| AIExplainModal | Deduplicated sections and empty-section omission | Preserved via existing text helpers | PASS |
| AIExplainModal | Correct-answer box, examples, mistakes, memory tips, follow-ups | Preserved | PASS |
| AITeacherModal | `open`, `data`, `context`, `character`, `onTutup`, `onLatih` | Same props retained | PASS |
| AITeacherModal | Teach flow sections, practice prompt, examples, mistakes, memory tip | Preserved | PASS |
| App / BetaChrome | Shared modal-open suppression for feedback chrome | Preserved and strengthened with inert background shell | PASS |
| Modal rewrite overall | Analytics/storage/schema changes | None introduced | PASS |

No missing public prop or user-facing Stage 7D behavior loss was found during the compatibility review.

## Modal runtime helper behavior

File: [src/components/ai/modalRuntime.js](/C:/Project/jannati-ai-tutor-v1/src/components/ai/modalRuntime.js)

Verified behavior:

- PASS — reusable hook/helper only
- PASS — no new dependency
- PASS — no storage/schema changes
- PASS — guards body lock for repeated open/close cycles
- PASS — tracks nested open state with `activeModalCount`
- PASS — restores original body styles only after the final modal closes
- PASS — preserves scroll position
- PASS — moves initial focus inside the dialog
- PASS — traps Tab / Shift+Tab inside the dialog
- PASS — restores focus to the original trigger on close
- PASS — Escape close is handled in one shared place
- PASS — helper is only evaluated inside `useEffect` for browser-only DOM work

## Background inertness

Current contract:

- `BetaChrome` now wraps non-modal app chrome in `app-chrome-shell`
- when any AI modal is open:
  - `data-modal-open="true"`
  - `aria-hidden="true"`
  - `inert`
- modal content is portaled to `document.body`, so the hidden/inert ancestor does not contain the dialog itself
- body scrolling is locked while modal content remains scrollable

Result: PASS

## Final DOM structure

All three AI modal surfaces now follow the same runtime shape:

```html
backdrop
  dialog section
    header
    status/secondary row (where used)
    scroll body
    footer
```

Structural checks:

- PASS — one backdrop per component
- PASS — one dialog per component
- PASS — header/body/footer are siblings
- PASS — Tutor context card is inside normal body flow
- PASS — “Bantuan untuk soalan ini” is inside normal body flow
- PASS — quick prompts remain inside the modal shell
- PASS — no duplicated close button
- PASS — no nested dialog shell
- PASS — no app footer/FAB/switcher mounted inside the modal

## Tutor AI content ordering

Tutor AI now renders in this order:

1. Header
2. Status row
3. Scroll body
   - context card
   - “Bantuan untuk soalan ini”
   - “Lihat kemajuan saya”
   - chat transcript / loading / fallback bubbles
4. Footer input row

Result: PASS

## Focus, Escape, and cleanup

Validated by [scripts/validate/v31Stage7dAiModalAudit.mjs](/C:/Project/jannati-ai-tutor-v1/scripts/validate/v31Stage7dAiModalAudit.mjs):

- PASS — prior focus is stored
- PASS — focus enters the modal on open
- PASS — Escape close path exists
- PASS — Tab wraps from last to first
- PASS — Shift+Tab wraps from first to last
- PASS — focus returns to trigger on close
- PASS — body scroll lock restores previous styles
- PASS — repeated open/close cycles remain safe

## CSS cleanup

What changed:

- added one canonical Stage 7D modal override block
- normalized shared backdrop, shell, header, body, footer behavior
- moved Tutor-specific help blocks into contained flow styling
- added mobile `100dvh` contract with safe-area aware padding
- added explicit mobile restatement for Stage 7A shell/FAB rules so the historical validator still targets the correct final block

What was deliberately avoided:

- no negative-margin modal positioning
- no absolute-positioned Tutor help panels
- no fixed-height modal body
- no new z-index scale outside existing modal tokens

CSS status: PASS

## Screenshot results

Requested paths:

| Screenshot | Status | Notes |
|---|---|---|
| `artifacts/stage7d/390-explain-top.png` | PARTIAL | Headless browser capture attempt failed; no reliable image evidence produced |
| `artifacts/stage7d/390-explain-middle.png` | PARTIAL | Harness prepared but capture unavailable |
| `artifacts/stage7d/390-explain-bottom.png` | PARTIAL | Harness prepared but capture unavailable |
| `artifacts/stage7d/390-teach-top.png` | PARTIAL | Harness prepared but capture unavailable |
| `artifacts/stage7d/390-teach-bottom.png` | PARTIAL | Harness prepared but capture unavailable |
| `artifacts/stage7d/390-tutor-ai.png` | PARTIAL | Harness prepared but capture unavailable |
| `artifacts/stage7d/768-explain.png` | PARTIAL | Harness prepared but capture unavailable |

Reason:

- Chrome/Edge headless screenshot attempts failed in this environment due GPU/headless rendering crashes.
- No screenshot file is being claimed as evidence.
- Harness files exist so a reliable browser can be pointed at the exact modal states later.

## Validator results

### Stage 7D

- PASS — `node scripts/validate/v31Stage7dAiModalAudit.mjs`

### Historical validators through Stage 7C/Stage 6

- PASS — `node scripts/validate/v31Stage7cGamificationConsistencyAudit.mjs`
- PASS — `node scripts/validate/v31GamificationTextAudit.mjs`
- PASS — `node scripts/validate/v31Stage7bCommunicationConsistencyAudit.mjs`
- PASS — `node scripts/validate/v31Stage7aMobileChromeAudit.mjs`
- PASS — `node scripts/validate/v31BrowserEnvironmentAudit.mjs`
- PASS — `node scripts/validate/v31CoachContextIconAudit.mjs`
- PASS — `node scripts/validate/v3CoachPayloadAudit.mjs`
- PASS — `node scripts/validate/communicationModulesAudit.mjs`
- PASS — `node scripts/validate/audioContentAudit.mjs`
- PASS — `node scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`
- PASS — `node scripts/validate/v31VisualWowSafetyAudit.mjs`
- PASS — `node scripts/validate/v31Stage1MobileShellAudit.mjs`
- PASS — `node scripts/validate/v31Stage2CommunicationAudit.mjs`
- PASS — `node scripts/validate/v31Stage3CoachUasaAudit.mjs`
- PASS — `node scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs`
- PASS — `node scripts/validate/v31Stage5PlanningLabelsAudit.mjs`
- PASS — `node scripts/validate/v31Stage6FinalRegressionAudit.mjs`

### Build and diff

- PASS — `npm run build`
- PASS — `git diff --check`
- PASS — `git restore --worktree -- dist/index.html`
- PASS — `git diff --exit-code -- dist/index.html`
- PASS — `git restore --worktree -- vite-preview.out.log`
- PASS — `git diff --exit-code -- vite-preview.out.log`

## Bundle delta

Stage 7C baseline:

- main JS: `719.99 kB`
- main CSS: `95.72 kB`

Current Stage 7D build:

- main JS: `721.69 kB`
- main CSS: `96.57 kB`

Delta:

- JS: `+1.70 kB`
- CSS: `+0.85 kB`

## git status --short

This remains a mixed worktree. Current short status includes many earlier-stage files plus the new Stage 7D files. Key Stage 7D entries:

```text
M src/App.jsx
M src/styles/style.css
M src/components/ai/AIExplainModal.jsx
M src/components/ai/AITeacherModal.jsx
M src/components/ai/TutorAIModal.jsx
?? src/components/ai/modalRuntime.js
?? scripts/validate/v31Stage7dAiModalAudit.mjs
?? artifacts/
```

## git diff --stat

Current full-worktree diff stat snapshot:

```text
31 files changed, 3196 insertions(+), 728 deletions(-)
```

This includes prior mixed-worktree edits outside Stage 7D.

## dist / preview-log status

| File | Status |
|---|---|
| `dist/index.html` | PASS — restored, no remaining diff |
| `vite-preview.out.log` | PASS — restored, no remaining diff |

## Remaining real-iPhone checks

These still require manual device/browser verification:

- actual iPhone Safari keyboard-open behavior
- real safe-area interaction with Dynamic Island/notch devices
- touch scrolling inside long Explain/Teach/Tutor bodies
- visual proof that footer never collides with Safari bottom toolbar
- screenshot captures from a reliable browser/device

## Final Stage 7D readiness

Runtime / validator / build status:

- Runtime structure: PASS
- Accessibility and cleanup contract: PASS
- Historical regression chain: PASS
- Build: PASS
- Screenshot evidence: PARTIAL

Because screenshot verification remains PARTIAL, this report does **not** claim final Stage 7D device acceptance completion yet.
