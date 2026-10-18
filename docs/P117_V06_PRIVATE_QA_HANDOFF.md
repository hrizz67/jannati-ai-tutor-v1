# P1.17-V06 — Private speech-QA execution handoff

Status: **QA BUILD IN CI / NO LIVE AUDIO / NOT DEPLOYED / DO NOT MERGE**.
Production remains v3.13.32. Do not confuse this QA mode with the deliberately offline `build:qa-preview`.

## Source and separation
- Draft PR #142 includes a dedicated Worker, protected client adapter and separate build `build:quiz-stt-qa`.
- The existing generic QA preview strips Supabase and STT intentionally, and cannot test live transcription.
- `quiz-stt-qa` build uses immutable PR head revision, a distinct HTTPS QA origin, separate test Supabase project, publishable key and dedicated QA Worker endpoint.
- The QA build flags are never enabled by the regular production build: official tagged deployment remains without the pilot.
- No automated upload, Pages deploy or Worker deploy exists in the QA packaging script.
- `workers/quiz-stt/wrangler.jsonc` keeps `QUIZ_STT_PILOT_ENABLED=false` and `CORS_ALLOW_ORIGINS=https://qa.invalid` until an operator explicitly configures an isolated deployment.

## Operator prerequisites BEFORE any QA deployment
1. Obtain explicit approval for an **isolated QA Worker and private QA Pages site** only. This does not authorize merge, tagging, main, public Pages or the Bacaan/Bertutur Worker.
2. Use a dedicated test Supabase project and fabricated learner account(s); never real children's learning data. Confirm adult-test consent for remote audio processing.
3. Confirm Cloudflare Workers AI free/paid usage and hard account budget controls. Namespace IDs `11011` and `11012` must be reviewed for conflicts and operational limits. Per-account 4/60s and global 20/60s are *rate limits*, not a daily billing cap.
4. Restrict the QA Pages site to specific adult testers **before** uploading the artifact. The generated `_worker.js` fails closed unless the Pages secrets `QA_ACCESS_USERNAME` and `QA_ACCESS_PASSWORD` are configured. Cloudflare Access may be used instead when it is already available without a paid/overage enrollment. Set a separate nonproduction HTTPS origin; never host on `hrizz67.github.io`.
5. Restrict the QA Worker with server-side Supabase Auth verification and `QUIZ_PILOT_ALLOWED_USER_IDS` for only QA tester UUIDs. Set Worker CORS to that single QA Pages origin, not the production Pages origin.
6. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `QUIZ_PILOT_ALLOWED_USER_IDS` via protected Worker secrets/environment settings. The publishable key is public by design, but secrets/allowlist must not appear in git or exported traces.
7. Enable server `QUIZ_STT_PILOT_ENABLED=true` only when other gates are in place. Ensure Worker cannot be deployed accidentally under an open test domain.

## Build locally without deploying (PowerShell)
Use the exact reviewed PR head SHA; do not substitute `main` or a mutable branch name.

```powershell
$env:VITE_BUILD_REVISION = '<REVIEWED_40_CHAR_PR_HEAD_SHA>'
$env:QUIZ_STT_QA_CONFIRM = 'ISOLATED_QA_ARTIFACT_ONLY'
$env:QUIZ_STT_QA_ORIGIN = 'https://<PRIVATE_QA_PAGES_HOST>'
$env:VITE_SUPABASE_URL = 'https://<TEST_SUPABASE_PROJECT>.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_<TEST_PUBLIC_KEY>'
$env:VITE_QUIZ_STT_ENDPOINT = 'https://<PRIVATE_QA_WORKER_HOST>/v1/quiz/transcribe'
npm ci
npm run build:quiz-stt-qa
```

Output: `qa-quiz-stt-site/` with `/_headers`, `/_redirects`, a generated credential-free `/_worker.js` access gate, immutable manifest, and nested `/jannati-ai-tutor-v1/` website. It is **not published by this command**. The script strips inherited `VITE_*` variables, disallows `.env.local`, refuses any public Pages origin, strips the shared `VITE_STT_ENDPOINT`, and injects only the QA data it validates. Configure the two Pages access secrets before upload and verify anonymous requests receive `401` (or `503` when the secrets are absent).

## Negative server checks BEFORE any voice upload
- While disabled: any valid-looking POST returns 503 `pilot-disabled`.
- After explicit QA-only enablement: missing token -> 401; expired/forged token -> 401; valid nonallowlisted user -> 403; wrong Origin -> 403; unsupported method/type -> 405/415; over 1 MiB -> 413; exhausted global or account capacity -> 429.
- OPTIONS preflight from the exact QA origin returns CORS `Authorization` allowance, but no wildcard origin or cookie credentials.
- No audio or transcript in access logs, error telemetry, browser exported trace or Worker persisted storage. Check Cloudflare provider settings manually.
- Make only synthetic no-audio/invalid-body requests for preflight and negative checks. Do not submit audio until permission and privacy gates pass.

## Physical acceptance (separate; still NOT RUN)
1. With test-adult consent, access the QA Pages host on iPhone Safari (record device/OS/browser), sign in to the allowlisted test account and explicitly append `?quizMobileSttPilot=1`.
2. For 5 quiz questions: each requires a fresh mic tap; record <=8 seconds; optionally stop early; wait for the editable transcript; explicitly press Semak Jawapan; proceed to next only after completion.
3. With a 4-request-per-minute account cap, **wait for the quota window to pass before the fifth upload**; an expected 429 from faster testing is not an STT transcription defect.
4. Confirm no stale Q1 transcript appears in Q2, no automatic grading, microphone indicator/track stops, and typed-answer fallback survives failure.
5. Repeat on Android Chrome. Also verify denial of mic permission, disconnect while uploading, cancellation, pagehide, retry, and no endless spinner.
6. Desktop Chrome normal quiz should remain unchanged; Bacaan/Bertutur real production STT is tested independently, never routed through the QA Worker.
7. Measure actual transcript quality for BM, English and Arabic and Worker latency/cost; only then propose a controlled next-phase rollout.

## Exit conditions
- CI must pass test suite, validation, production build, old offline QA preview and new dummy-only private QA build.
- Security, QA operator and privacy gates must be signed off for the isolated environment before any deployment.
- **Physical iPhone/Android STT PASS cannot be inferred from synthetic tests.**
- After tests, disable server kill switch, remove test account allowlist, delete temporary site, revoke QA sessions and clear QA origin data.
- No main merge, release tag, production deployment, payment/sync or reward adjustments in this phase.
