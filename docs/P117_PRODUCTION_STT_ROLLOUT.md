# P1.17 Quiz STT production rollout

## Security boundary

- Quiz speech uses the dedicated `jannati-ai-tutor-quiz-stt` Worker and `/v1/quiz/transcribe`; it never routes to the Bacaan/Bertutur Worker.
- `QUIZ_STT_PILOT_ENABLED=false` is the emergency kill switch and is the committed production default.
- `QUIZ_STT_ACCESS_MODE=allowlist` permits only UUIDs in the encrypted `QUIZ_PILOT_ALLOWED_USER_IDS` secret. This mode is for the consented adult physical test only.
- `QUIZ_STT_ACCESS_MODE=registered` permits any user only after the Worker has revalidated the Supabase access token server-side. Anonymous, invalid and expired tokens remain HTTP 401.
- Missing or unknown access policy, auth configuration, rate-limit binding or AI binding fails closed.
- Production CORS is exactly `https://hrizz67.github.io`. The account limiter is 4 requests/minute and the global limiter is 20 requests/minute.
- Each upload is limited to 1 MiB and the browser capture is limited to 8 seconds. No application storage, transcript logging or audio logging is added.

Production secrets are configured with Wrangler secret storage only: the production Supabase URL, browser-safe publishable key and the temporary physical-test allowlist. Never use a service-role key, QA project credential or tracked environment file.

## Controlled sequence

1. Independently review code, consent copy, privacy notice, tests, quotas and free-plan status.
2. Deploy only the dedicated production Quiz Worker with the committed kill switch OFF. Confirm HTTP 503 `pilot-disabled` from the production origin.
3. For a time-bounded adult physical test, set access mode to `allowlist`, retain exact production CORS, enable the Worker and test one approved adult account on iPhone Safari and Android Chrome.
4. If either device fails, immediately restore `QUIZ_STT_PILOT_ENABLED=false`. Do not claim acceptance.
5. Only after both devices and security gates pass, change access mode to `registered` and enable the Worker. Recheck 401, 403/CORS, 429, no-speech, timeout, cancellation, Q1-to-Q2 isolation and typing fallback.
6. Monitor invocation errors, authentication failures, rate-limit responses, latency and Workers AI allocation without logging learner content.

## Rollback

The first rollback is the Worker kill switch. If the frontend itself regresses, restore the last stable GitHub Pages deployment/tag. Do not retag or force-push an immutable release.

Physical iPhone Safari, Android Chrome, VoiceOver and TalkBack status must be reported from actual hardware evidence. Automated tests are not physical acceptance.
