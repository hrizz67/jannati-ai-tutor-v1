# P1.17-V01 — Quiz Mobile STT Pilot and Capacity Audit

Status: **CODE PILOT / PHYSICAL ACCEPTANCE NOT RUN / NO PRODUCTION DEPLOYMENT**
Baseline: `v3.13.28` (`f971c0d1bccc1fe870a58788b9d4fbe061c6b7e0`)

## Background and evidence

A physical iPhone Safari test found that a normal quiz question accepted Q1 voice transcript, but the native microphone indicator appeared to remain active when entering Q2 without a new microphone tap; after a delay it cleared, and a subsequent Q2 tap worked. Android Chrome remains **NOT VERIFIED**, not a confirmed reproduction. Existing Bacaan/Bertutur MediaRecorder-to-STT behavior was reported working on mobile devices.

The normal quiz uses the browser's native Web Speech recognition. Mobile Bacaan/Bertutur already use `createMobileMediaSttSession` backed by `mediaSttCapture`, `sttAdapter` and the first-party STT Worker. The new pilot reuses that proven path **only when explicitly opted in**.

This change does **not** claim that delayed OS-level privacy-indicator clearing proves ongoing audio capture. Validate native track lifecycles during hardware retest.

## Pilot gate and UX

- Append `?quizMobileSttPilot=1` to a suitable QA/preview URL on supported iPhone Safari or Android Chrome. This is an **opt-in test switch**, not authentication, a capacity control, or permission to enable it for children publicly.
- The gate requires a configured HTTPS STT endpoint and `getUserMedia` + `MediaRecorder`. Otherwise the quiz exposes manual entry, not a hidden Web Speech fallback.
- Default quiz Web Speech and desktop behavior remain unchanged when the switch is absent.
- The shared media-STT factory is preloaded outside the tap handler; native capture still starts **only when the learner taps** the microphone.
- Each quiz recording has an 8-second auto-stop limit, plus a manual **Henti rakaman** action.
- Mic tracks release before upload; the transcript is shown for correction and **never automatically graded**.
- A question switch, answer check, navigation, unmount or `pagehide` cancels in-flight capture/provider work. Late Q1 callbacks cannot write Q2 answers.
- Bacaan/Bertutur and their existing 20/25-second limits are unchanged.

## Existing Worker limits (static configuration audit)

`workers/stt/wrangler.jsonc` currently declares `STT_RATE_LIMITER`: **60 requests / 60 seconds**. `workers/stt/src/index.js` keys its limiter by `stt:${origin}` so all callers using the production origin **share one quota bucket**. This is not a per-account or per-child quota.

The Worker currently:
- Permits only configured CORS origins (production GitHub Pages), but an Origin header by itself is **not authentication**.
- Accepts `ms-MY`, English and Arabic locales; invokes Workers AI `@cf/openai/whisper-large-v3-turbo`.
- Enforces up to **5 MiB** audio per request, validates MIME and rate limits, and returns bounded transcript metadata.
- Does not authenticate the learner or verify Premium entitlement on the STT request.
- Does not provide a per-user daily quota or a confirmed Workers AI Neurons budget safeguard within this repository.

**Capacity examples, not forecasts:** 10 concurrent learners making 6 STT calls in a minute consume the entire 60/min shared allowance. Audio cost depends on billable model usage, capture duration, failed calls and Workers AI plan; verify current Cloudflare dashboard figures rather than assuming the free allowance makes unlimited use free.

**Rollout blockers:** Before broad/public activation, implement and independently review server-validated identity/entitlement (if applicable), abuse prevention and per-account limits, budget/usage alerts, privacy notice/consent, rate-limit strategy, and safe fallback when Worker returns HTTP 429/5xx. Do not remove CORS/size/time limits or embed provider credentials in the browser.

## Acceptance matrix

| ID | Device/path | Expected | Status |
| --- | --- | --- | --- |
| QV-01 | iPhone Safari pilot Q1→Q2→Q3 | No unsolicited recording; fresh tap records/transcribes; no stale text | NOT RUN |
| QV-02 | Android Chrome pilot Q1→Q2→Q3 | Same as QV-01; test delayed native callbacks | NOT RUN |
| QV-03 | iPhone/Android denied microphone | Manual typing remains usable | NOT RUN |
| QV-04 | iPhone/Android airplane mode during capture/upload | Bounded error; no lost answer/progress; manual fallback | NOT RUN |
| QV-05 | iPhone/Android navigation during recording | Recorder and audio tracks stop; no old response in new question | NOT RUN |
| QV-06 | Bacaan/Bertutur iOS/Android regression | Existing MediaRecorder STT still works | NOT RUN |
| QV-07 | Desktop Chrome normal quiz | Existing native Web Speech behavior is unchanged | NOT RUN |
| QV-08 | Load/rate-limit simulation | 429 shows safe fallback, no retry storm; capacity budget approved | NOT RUN |
| QV-09 | Production privacy/authorization | Independently approved before public enablement | ON HOLD |

Record device model, OS/browser versions, URL mode, microphone indicator/track evidence, request count, actual latency, screenshot/video and tester/date. Synthetic Vitest results are not physical evidence.

## Release control

Pilot is implemented in a development PR for independent review. **No merge, release tag, Worker deployment or production GitHub Pages deployment is authorized.** Production remains stable `v3.13.28`. Existing stable rollback reference is `v3.13.27`.

A future test deployment requires separate review and approval. Do not classify QV-01/QV-02 as PASS from CI, or change global default voice mode without verified physical tests and a backend quota/privacy decision.
