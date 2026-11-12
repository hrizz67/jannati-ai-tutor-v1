# P2.6-A2 — 144-case current-main local-first dialogue baseline

## Provenance and scope

- This is a **test-only port** of historical Draft [PR #164](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/164) at head `8720160f37f124397adfb38ef81686ad30244ad6`. That Draft is 104 commits behind current main and is **not mergeable as-is**. Keep it unchanged as historical measurement evidence.
- New baseline: immutable main `2b349f4b46e98a8922b0d3dd52c6d3a57f30f403` after PR #193. No runtime, router, teaching, scoring, rewards, security, auth, speech, Worker, API, stored student data, database, dependency or deployment changes.
- Reuses the 18 prompt templates crossed with **8 subject contexts = 144 synthetic conversations**, each with four prior turns. This is a correlated fixture set, **not 144 independent student samples**.
- Runnable as `npx vitest run tests/unit/tutorNaturalDialogueCurrentBaseline.test.js`. Report prefix: `P26A2_CURRENT_MAIN_BASELINE=` followed by machine-readable JSON.
- Measures local intent accuracy, macro-F1, confusion recall and matrix, per-subject class match and explicit synthetic safety/unsupported cases. Output is logged in CI; intent quality misses are **findings**, not CI failures. The privacy, no-remote-AI, no-generative-fallback and fixture-integrity invariants remain hard CI gates.

## Independence and blind spots

- This suite calls `understandStudentTurn` and the local-first router but **does not independently grade natural-language Tutor responses**. Real response quality, correct explanations, age suitability, language quality, no-answer-leakage and pedagogical rubric require separate response-level tests and human teacher review. The current main has response-level regressions such as `tutorNaturalDialoguePhase1.test.js`, `tutorChromeAuditGrounding.test.js` and `tutorFiveTurnDialogue.test.js`, which serve a complementary function and are not replaced.
- These original gold intents are preserved for comparability, **not independently revalidated**. Some may be over-specified or legitimately differ by active-question and teaching-stage context. Do not optimize code against this template suite alone or claim a quantitative population accuracy.
- `SAFETY_BLOCKED` and `UNSUPPORTED` expected routing checks use synthetic phone number and finance requests; test failure is a blocker for this PR, not an authorization to enable remote services.

## Integration decisions

- **DRAFT / AUDIT-ONLY / DO NOT MERGE** until an independent multi-role reviewer analyzes exact-head CI measurements, labels, false positives and per-subject behavior.
- Never merge historical PR #164 automatically or claim its old source matches current main. Any runtime remediation must be a **separate, minimal, evidenced Draft PR** with response-level tests.
- QA Chrome with synthetic Parent/PIN and second child, physical device accessibility, Gate A2, real children and paid rollout remain HOLD. Remote generative AI and Quiz STT Worker stay OFF. Production v3.13.39 unchanged.
