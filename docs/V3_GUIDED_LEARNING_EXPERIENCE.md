# Jannati AI Tutor v3.2 — Guided Learning Experience

## Goals

The existing offline Tutor AI now opens instantly, guides before revealing, and gives a short next action. The change is limited to coaching copy and modal presentation; scoring, XP, question selection, adaptive calculations, UASA calculations, and study planning remain unchanged.

## Four tutor modes

| Mode | Behaviour |
| --- | --- |
| `coach` | Focuses attention, asks one guiding question, then raises the hint level. |
| `teacher` | Explains a concept with a short example when the learner requests teaching. |
| `examiner` | Confirms what is correct or incorrect and explains the marking reason briefly. |
| `motivator` | Connects encouragement to revision, improvement, or completion activity. |

`resolveTutorMode()` selects the mode from intent and exercise state. Learners do not choose modes manually.

## Guided support ladder

1. **Focus attention** — a clue about the instruction or subject.
2. **Guiding question** — one small question, with optional quick replies.
3. **Strong hint** — a clearer clue after another attempt or hint.
4. **Answer disclosure** — only after an explicit request, completion, three attempts, or three meaningful hints.

Tutor quick replies are conversation inputs only. They never submit an official exercise answer, award XP, or alter a score.

## Misconception categories

The deterministic classifier uses instruction, options, expected answer, learner answer, subject, topic, and question metadata. Current categories include object/person confusion, common/proper noun confusion, operation confusion, place value, vocabulary, classification, Arabic spelling, no attempt, and a cautious general category. Confidence is deliberately modest when evidence is weak.

## State machine

`idle → greeting → awaiting_attempt → incorrect_first → guiding_question → strong_hint → answer_reveal_allowed` and `awaiting_attempt → correct_first_try/correct_after_support → completed`.

Transitions are calculated only when a response is explicitly requested. No effect regenerates a response during render, and request IDs invalidate stale responses.

## Subject guidance

BM uses clue words and full sentences; Mathematics identifies the operation and works one step at a time; English uses short examples; Science asks learners to observe and compare; Arabic preserves right-to-left text and pronunciation; Pendidikan Islam uses respectful lesson-based wording; PJ/PK prioritise safe, healthy actions.

## Janna personality and praise

Janna is warm, calm, patient, respectful, and honest when context is missing. Praise references behaviour: “Kamu membaca arahan dengan teliti.”, “Kamu membetulkan jawapan selepas menggunakan petunjuk.”, or “Tepat. Kamu terus menjumpai jawapan yang diminta.” Generic praise is retained only as a fallback and is not the sole response.

## Answer disclosure policy

Early hints do not include the expected answer. The answer is available only under the explicit policy conditions above. Existing explanation modals retain their current callbacks and layout.

## Year 2 language limits

Short sentences, one idea at a time, one question and one example at a time. Hints target roughly 8–28 words, guiding questions 5–18 words, explanations up to 140 words, and motivation up to 20 words. Arabic/Jawi strings are not sliced by the guard.

## Emotional safety

Shaming phrases are filtered. The tutor uses “Tak mengapa”, “Mari cuba langkah yang lebih kecil”, and “Kita semak satu bahagian dahulu.”

## Progressive explanation and visual feedback

The chat starts with a short greeting. Responses expose the next action and optional quick replies. Guiding, hint, and correction messages have restrained one-shot motion classes. `prefers-reduced-motion: reduce` disables those animations.

## Personalised memory boundaries

Only existing attempt count, hint count, current learner answer, current session context, and supplied profile data are used. No new cloud store or fabricated history is introduced.

## Performance and accessibility

The modal does not run the response engine on open. Explicit requests retain the 4.5-second timeout, `finally` loading cleanup, stale-request guard, Escape close, focus restoration, focus trap, `aria-live="polite"`, and body-scroll cleanup.

## Test scenarios

The guided validator covers BM noun confusion, Mathematics operation guidance, English vocabulary, Science classification, Arabic text preservation, first-attempt correctness, guiding replies, no meaningful attempt, answer-disclosure threshold, internal-token sanitisation, and emotional-safe wording.

## Validation

Run `node scripts/validate/guidedLearningExperienceAudit.mjs` together with the existing Tutor modal, AI context, integration, dashboard, compact UI, production polish, UI, and release-candidate validators, followed by `npm run build`.

## Limitations

The current classifier is intentionally lightweight and local. It does not claim deep diagnosis, and visual/browser manual testing remains required on representative desktop and mobile devices.
