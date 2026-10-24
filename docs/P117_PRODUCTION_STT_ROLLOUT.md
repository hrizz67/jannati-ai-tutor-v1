# P1.17 Quiz STT production rollout

## Security boundary

- Quiz speech uses the dedicated `jannati-ai-tutor-quiz-stt` Worker and `/v1/quiz/transcribe`; it never routes to the Bacaan/Bertutur Worker.
- `QUIZ_STT_PILOT_ENABLED=false` is the emergency kill switch and is the committed production default.
- `QUIZ_STT_ACCESS_MODE=registered` permits any account only after the Worker has revalidated the Supabase access token server-side. Anonymous, invalid and expired tokens remain HTTP 401. No UUID allowlist is used in production.
- Missing or unknown access policy, auth configuration, rate-limit binding or AI binding fails closed.
- Production CORS is exactly `https://hrizz67.github.io`. The account limiter is 4 requests/minute and the global limiter is 20 requests/minute.
- A strongly consistent global counter permits at most 100 Quiz AI inferences per UTC day and fails closed if its binding or storage is unavailable. It stores only the UTC date and aggregate count—never identity, audio, transcript or learner content.
- Each upload is limited to 1 MiB and the browser capture is limited to 8 seconds. No application storage, transcript logging or audio logging is added.

Production secrets are configured with Wrangler secret storage only: the production Supabase URL and browser-safe publishable key. Never use a service-role key, QA project credential or tracked environment file.

The public frontend build permits only an explicit `?quizMobileSttPilot=1` opt-in on supported mobile browsers. It does not auto-enable recording. A Supabase session and the Worker controls remain mandatory; the query parameter is not an access-control boundary.

## Controlled sequence

1. Independently review code, consent copy, privacy notice, tests, quotas and free-plan status.
2. Deploy only the dedicated production Quiz Worker with the committed kill switch OFF. Confirm HTTP 503 `pilot-disabled` from the production origin.
3. Deploy the tagged frontend while the Worker remains OFF. Confirm that ordinary users stay on the existing Quiz path unless they explicitly add the opt-in query.
4. Verify the Cloudflare account remains on the Free plan, the provider allocation is 10,000 neurons/day, the 100-inference UTC counter works, and no paid billing path is enabled.
5. Enable only the dedicated production Quiz Worker in `registered` mode and test one consented adult production account on iPhone Safari, then Android Chrome. Recheck 401, CORS rejection, 429, no-speech, timeout, cancellation, Q1-to-Q2 isolation and typing fallback.
6. If either device or any security/cost gate fails, immediately restore `QUIZ_STT_PILOT_ENABLED=false`. Do not claim acceptance.
7. Monitor invocation errors, authentication failures, rate-limit responses, latency, quota remaining and Workers AI allocation without logging learner content.

## Rollback

The first rollback is the Worker kill switch. If the frontend itself regresses, restore the last stable GitHub Pages deployment/tag. Do not retag or force-push an immutable release.

Physical iPhone Safari, Android Chrome, VoiceOver and TalkBack status must be reported from actual hardware evidence. Automated tests are not physical acceptance.
