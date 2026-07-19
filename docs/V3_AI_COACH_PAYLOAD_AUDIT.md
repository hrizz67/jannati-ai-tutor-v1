# V3 AI Coach Payload Audit

## Final Payload Contract

The coach adapter now normalizes modal data into a stable contract before it reaches the UI.

```js
{
  explanation: string,
  steps: string[],
  hint: string,
  learningTip: string,
  praise: string,
  correctAnswer: string,
  subject: string,
  topic: string,
  fallbackUsed: boolean,
  source: "coach-v3" | "fallback",
  error: null | {
    code: string,
    message: string
  }
}
```

### Contract rules

- Missing strings become `""`.
- Missing list fields become `[]`.
- Arrays are flattened and de-duplicated.
- Object-shaped coach output is normalized into plain strings before it reaches the modal.
- No `undefined`, `null`, or `[object Object]` text should appear in the UI.

---

## Field Mapping

### AI Explain Modal

Rendered fields:

- `explanation` → main explanation block
- `learningTip` → tip learning section
- `hint` → hint block
- `steps` → new step list section
- `praise` → encouragement voice / support text
- `correctAnswer` → answer box
- `subject` / `topic` → audit-friendly metadata and logging
- `fallbackUsed` / `error` → contract diagnostics only

### Ajar Saya / AI Teacher Modal

Rendered fields:

- `explanation` → explanation block
- `learningTip` → tip learning section
- `steps` → new step list section
- `praise` → encouragement / practice tone
- `correctAnswer` → answer context
- `subject` / `topic` → metadata and logging
- `fallbackUsed` / `error` → contract diagnostics only

### Notes on content rendering

- Bahasa Melayu and English text render as plain strings.
- Arabic and Jawi text also render as plain strings, preserving the original Unicode content.
- Steps and tips are now safe to voice-read and display even when the Knowledge Engine returns partial data.

---

## Fallback Behavior

Fallback sequence:

1. `coachController()` returns a structured coach payload.
2. The adapter normalizes the payload.
3. If the payload is incomplete, the adapter fills missing pieces from the legacy explanation / teacher engine.
4. If the controller throws or the payload is malformed, the adapter returns a safe fallback payload.

This means the modals still show:

- hint
- learningTip
- praise

even when the Knowledge Engine output is partial.

---

## Audit Scenarios

The following deterministic scenarios were checked:

1. complete coach payload
2. partial coach payload
3. empty Knowledge Engine response
4. malformed steps
5. missing correct answer
6. unknown subject
7. Arabic/Jawi content
8. fallback response

### Results

- complete payload: passed
- partial payload: passed with fallback
- empty response: passed with fallback
- malformed steps: passed with fallback
- missing correct answer: passed, normalized to `""`
- unknown subject: passed, used safe display label
- Arabic/Jawi content: passed
- fallback response: passed

---

## Issues Found and Fixes Applied

### 1. Object-shaped coach content reaching the modals

Issue:

- `coachController()` returned grouped objects for some fields.
- Without normalization, UI sections could receive objects instead of strings.

Fix:

- Added `normalizeCoachPayload()` inside `coachAdapter`.
- Converted all display fields into predictable strings and arrays.

### 2. Missing answer placeholders

Issue:

- Missing answers could surface as placeholder text.

Fix:

- `correctAnswer` now normalizes to `""` when no real answer exists.

### 3. Malformed step data

Issue:

- Non-array steps could slip through contract checks.

Fix:

- `steps` now normalizes to `[]` when malformed.
- The adapter marks the payload as fallback-safe.

### 4. Unknown subject display

Issue:

- Unknown subjects needed a readable label instead of a blank or technical value.

Fix:

- The adapter now uses a safe label fallback based on topic/title when needed.

### 5. Rendering safety in the modals

Issue:

- The modals needed predictable string/array input.

Fix:

- `safeList()` now accepts strings as well as arrays.
- Added small visible `Langkah` and `Tip belajar` sections.
- Fixed the close glyph rendering.

---

## Development Logging

Development-only warnings and diagnostics now include:

- subject
- topic
- response time
- fallback usage
- contract fallback details

No production console spam is emitted.

---

## Validation Results

- `node scripts/validate/v3CoachPayloadAudit.mjs` — passed
- `node scripts/validate/questionValidator.js` — passed with 0 errors, 39 warnings
- `npm run build` — passed

---

## Summary

The payload contract is now stable, deterministic, and safe for the existing UI.

Key outcome:

- coachAdapter normalizes data before it reaches the modals
- modals now receive predictable strings and arrays
- fallback behavior stays intact
- Arabic/Jawi text remains supported
- malformed payloads no longer risk UI crashes or placeholder leakage

