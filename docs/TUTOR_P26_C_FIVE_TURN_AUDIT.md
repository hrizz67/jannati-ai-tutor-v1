# P2.6-C — current-main Tutor five-turn synthetic acceptance probe

## Purpose

Test four **five-turn** trajectories through the public `getTutorResponse()` wrapper on immutable `main` `f0108b55054a2e3fea8bead943ceab6dc1c9636c` after PR #198. Twenty synthetic turns: BM active-question follow-up, English switch to an approved topic, Arabic study-plan/understanding/coaching, and English unknown-topic/no-invention recovery.

## Safety versus quality

Every turn has hard CI assertions for no remote/generative use, no grades or rewards, no exposed protected answer or answer metadata. English topic-switch steps also must not reuse the old question metadata. A separate bounded dialogue history is carried through each script and rendered response metadata is recorded.

The `P26C_MULTITURN_AUDIT=` JSON records each turn's prompt, public classification/intent, topic, question scope, teaching stage, clarification flag, and a **maximum 300-character excerpt of synthetic assistant output**. There are **no real children, personal data, accounts, cloud credentials, speech or persistence**. These records are correlated scripts, not independent samples or a statistical measure of teacher quality.

**Important:** `LOCAL_HANDLED` is not proof of good teaching. Human review must assess conceptual correctness, continuity, teaching scaffolding, unwanted generic replies, language consistency, explanation quality, false-premise coaching, appropriateness for Year 2 and screen-reader behavior. Current test intentionally does not codify unreviewed golden labels as hard failures. Anything marked as a dialogue-quality finding requires independent evidence and a separate remediation PR.

The simulated `newScope` steps explicitly clear the previous question and expected answers to model a correctly switched frontend conversation. This validates engine behavior under a correct scope transition; it **does not** prove the live frontend actually switches scopes. Browser/mobile testing remains required for that.

## Controls

- DRAFT AUDIT ONLY / NO MERGE until reviewed.
- No production release, deploy, tag, remote AI, Quiz STT Worker, Supabase, parent PIN or student schema change.
- Parent cloud/multi-child, Chrome, iPhone/Android physical, accessibility and screen reader HOLD; real children, paid rollout and Gate A2 NO-GO.
