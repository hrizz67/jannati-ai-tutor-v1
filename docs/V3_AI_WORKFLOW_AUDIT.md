# V3 AI Workflow Audit

## Scope

This audit covers AI Tutor two-way communication, AI Explain, AI Teacher, guided learning, misconception detection, speech hand-off, and context propagation from the final normalized question.

## Data flow

```text
Question bank / generator
        ↓
normalized question + subject + topic
        ↓
attempt history + hint stage + misconception signals
        ↓
Tutor adapter / tutorResponseEngine ──→ TutorAIModal
        ↓
explainEngine / knowledge adapter ────→ AIExplainModal
        ↓
teacherEngine / knowledge adapter ────→ AITeacherModal
```

## Findings

| Check | Result |
| --- | --- |
| Tutor entry point and context | PASS |
| Free-text input capture | PASS |
| Whitespace-only message guard | PASS |
| Bounded learner input | PASS |
| Enter-key handling | PASS |
| Rapid-send protection signals | PASS |
| Subject/topic context | PASS |
| Question-change reset signals | PASS |
| Safe fallback path | PASS |
| AI Explain wiring | PASS |
| AI Teacher wiring | PASS |
| Distinct Tutor vs Teacher responsibilities | PASS |
| Raw ID/metadata leakage in modal surfaces | PASS |
| Speech regression isolation | PASS |

## Subject handling

All eight registered subjects are present in the static coverage audit. Subject-specific language and content quality are covered by the existing BM, English, Arabic, Science, Math, Islam, and PJ/PK validators. Arabic/Jawi rendering is covered by Unicode/content validators and still needs real-device visual confirmation.

## Fallback and failure handling

The audited engines expose fallback/default wording when explanation data is incomplete. Missing context must still be covered by the manual malformed-question matrix; static checks cannot simulate every React timing race or browser interruption.

## Remaining risks

- Browser-level IME/mobile-keyboard behavior is not proven by Node scripts.
- Real microphone/speech-synthesis cancellation requires device testing.
- A long explanation and rapid modal reopen should be included in the manual pass.
- The main chunk remains above the Vite warning threshold; this is a performance warning, not an AI correctness blocker.
