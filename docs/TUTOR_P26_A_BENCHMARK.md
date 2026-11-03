# P2.6-A — Synthetic Natural Dialogue Benchmark (audit first)

Baseline source: `main` at `fa8acb8ea293ac829916c6b3b545dacc0f968853` (production `v3.13.37`). GitHub issue: [#160](https://github.com/hrizz67/jannati-ai-tutor-v1/issues/160).

## Scope

- `tests/unit/tutorNaturalDialogueBenchmark.test.js` generates **144 deterministic synthetic conversations**: 18 scenario templates in each of eight Year 2 subjects (BM, English, Mathematics, Science, Arabic, Islam, PJ, PK).
- Each fixture has four prior dialogue turns and a fifth student prompt, with explicit subject, active concept, accepted answer, target expectation and teaching stage when applicable.
- Covered: colloquial BM, typo/short form, BM/English/Arabic, references to earlier teaching, incorrect attempt, another example, micro-check continuation, topic switch, simulated phone number/PII, out-of-scope finance.
- No actual student conversations, Cloudflare requests, paid APIs, database access, behavioral analytics or scoring/XP writes.

## Reproduce

```sh
npx vitest run tests/unit/tutorNaturalDialogueBenchmark.test.js
```

The suite prints `P2.6-A_SYNTHETIC_BASELINE=<JSON>` containing intent macro-F1, confusion recall, per-subject coverage, full expected-versus-actual confusion matrix and list of failing fixtures. *Failures of intent quality are audit findings, not silently classified as passing.* The first slice only gates fixture integrity, nonuse of remote generative AI, and expected privacy/out-of-scope routing; quality targets are **not** enforced until the baseline and labeling are independently reviewed.

**Important statistical limitation:** these are 18 templates crossed with eight synthetic contexts; **144 fixtures are not 144 independent student language samples**. Macro F1 from these correlated examples is a diagnostic baseline only, not a validated real-world accuracy estimate.

## Teaching quality / safety

This first slice does **not** grade actual Tutor explanation correctness, naturalness, no hallucination, answer leakage, or teacher rubric. A professional teacher must review real engine responses from new *synthetic* hold-out fixtures, subject-by-subject, before anyone claims score ≥4/5. Never fabricate a teacher rating.

From owner-only iPhone screenshot evidence, prioritize:
1. BM place-noun prompt in which `bermain` is a verb, and a Tutor reply incorrectly described the wrong choice as a person name.
2. `apa tu?`, `dia tanya apa?` and `pastu camna?` should keep the **active question** context rather than ask for subject/topic redundantly.
3. `tak paham` and `x faham` should trigger a safe teaching recovery, not a graded answer attempt.

Use a separate minimal runtime-fix PR **after** verifying each failure at the full response layer. Preserve canonical scoring, answer reveal, child separation, maths and gamification. Quiz STT Worker and remote generative AI remain OFF. Issue #148 and real-device acceptance #156 remain HOLD.

## Release and assessment gate

This is a measurement-only Draft PR. Automated PASS means the *harness and safety checks* passed, not Tutor quality, no-answer-leakage, or physical iPhone/Android acceptance. No merge, tag, release, deploy, Worker or database changes are authorized.
