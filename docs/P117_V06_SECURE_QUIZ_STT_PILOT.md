# P1.17-V06 — Secure isolated Quiz MediaRecorder–STT pilot

Status: DRAFT / CI PENDING / PHYSICAL QA NOT RUN / NO MERGE OR DEPLOY.
Baseline: main 7a798878b92bee0f1206d843165569ef2ba5bcc9, stable v3.13.32.

## iPhone Safari evidence 2026-10-18
- Mic Input Probe: PASS, peak 0.771, 44% active samples.
- Native Web Speech: 1/2 results (second call timed out even outside Quiz).
- MediaRecorder: 4/4 captures with 92813, 93133, 92414, 92201 bytes respectively; approx 4 seconds; audio/mp4 AAC; tracks released.
- Recorded bytes do not prove real end-to-end transcription or upload reliability. Existing iPhone Quiz still FAIL.

## Architecture, access and privacy
- Do not change the existing Bacaan/Bertutur Worker (workers/stt) or its /v1/transcribe API.
- New Worker in workers/quiz-stt exposes only POST /v1/quiz/transcribe, separate from the shared Worker.
- Server-side QUIZ_STT_PILOT_ENABLED defaults false. Missing flag, bindings, auth or allowlist fails closed.
- User opt-in URL ?quizMobileSttPilot=1 is NOT authorization. Public deploy workflow still omits VITE_QUIZ_MOBILE_STT_PILOT_ENABLED and VITE_QUIZ_STT_ENDPOINT.
- Quiz requires a dedicated HTTPS endpoint /v1/quiz/transcribe; it cannot use the reading/speaking endpoint.
- The lazy Quiz adapter retrieves a Supabase access token from the active client session and sends it ONLY to the dedicated endpoint. Server verifies it via Supabase Auth GET /auth/v1/user.
- Server-only QUIZ_PILOT_ALLOWED_USER_IDS allows a small exact set of Supabase UUIDs. Empty denies all. Use only test accounts and adult consent.
- Independent account rate-limit binding 4 per 60 seconds; global binding 20 per 60 seconds; fail closed if binding unavailable.
- Cloudflare simple rate-limit binding is not a durable, globally atomic daily cost ledger. Add a durable quota ledger and metrics before broad rollout.
- Maximum audio payload 1 MiB, client cap 8 seconds; server does not verify duration from compressed media.
- No audio or transcript persistence or request logging in this code. HTTPS transfer to Cloudflare AI remains subject to provider processing/privacy terms.
- Manual typing stays available. No auto-grading. Existing stale question, cancellation, pagehide and voice cleanup safeguards remain.

## QA operator tasks (NOT YET AUTHORIZED TO DEPLOY)
1. Review new Worker security policy, CORS, Supabase verification, allowlist, two rate-limit bindings and real production-account namespace assignments.
2. Put SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and QUIZ_PILOT_ALLOWED_USER_IDS in protected Worker environment secrets. Never commit real values.
3. Enable QUIZ_STT_PILOT_ENABLED=true only in isolated approved pilot environment.
4. Enable VITE_QUIZ_MOBILE_STT_PILOT_ENABLED=true and VITE_QUIZ_STT_ENDPOINT=https://<qa-worker-host>/v1/quiz/transcribe only in isolated QA build; never tagged public production.
5. Verify eligible vs ineligible authenticated users, expired tokens, no auth, invalid origins, quota exhaustion, no speech, oversized audio, permission denied and stale navigation.
6. Verify real transcript accuracy and first-tap behavior for five sequential questions in iPhone Safari and Android Chrome; test desktop fallback.
7. Audit audio consent, child data, privacy notice, Cloudflare billable request capacity, and VoiceOver/TalkBack before proposing wider activation.

## Gate
- Unit, STT and Worker regression: CI PENDING.
- iOS/Android/Desktop physical test: NOT RUN.
- Live STT upload and accuracy: NOT RUN.
- Production scale/cost: NOT RUN.
- Merge, release, Worker deploy and Pages deploy: ON HOLD.
Production remains v3.13.32. Passing unit tests cannot be reported as physical PASS.
