# Tutor AI Generative Gateway

## Status

The generative gateway is implemented but disabled by default. Tutor AI continues to use the local curriculum engine unless every client and server safety switch is explicitly enabled.

This boundary is intentional because Jannati AI Tutor serves Year 2 learners. OpenAI's under-18 guidance requires additional age-appropriate safeguards and says personal data of children under 13, or below the applicable age of digital consent, should not be processed without first implementing zero data retention.

References:

- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/reference/cli/resources/moderations
- https://developers.openai.com/api/docs/guides/latest-model
- https://supabase.com/docs/guides/functions/auth-headers

## Architecture

1. `tutorResponseEngine.js` always produces a local curriculum-grounded response first.
2. `tutorGenerativeGateway.js` considers the remote gateway only when the local engine marks the answer as insufficient.
3. Personal-data and child-safety checks run locally before any network request.
4. The browser sends a minimized payload through the authenticated Supabase client.
5. The `tutor-ai` Edge Function verifies JWT access and checks the caller's Premium status using the caller's own RLS-scoped token.
6. The Edge Function remains closed unless the under-18 compliance and generative feature switches are both enabled.
7. User input and generated output pass through `omni-moderation-latest`; moderation failure closes the remote path instead of bypassing it.
8. OpenAI Responses API calls use `store: false`, strict JSON Schema output and a salted, one-way `safety_identifier` rather than a learner ID.
9. Any authentication, timeout, refusal, blocked output, invalid output or network failure returns control to the local Tutor AI response.

## Data excluded from the gateway

The gateway contract excludes:

- account and child-profile IDs;
- learner names and display names;
- email, phone, address, school and authentication data;
- progress history, scores, mastery, XP and streaks;
- expected answers and accepted-answer banks;
- complete profile or learning-sync payloads.

Known learner names are redacted from chat history. Obvious personal-data patterns cause the remote request to be rejected and produce a child-facing privacy reminder.

## Required configuration

Do not enable the gateway until the product owner has completed the applicable legal, privacy, parental-consent and OpenAI data-control review.

Client build variable:

```text
VITE_TUTOR_AI_REMOTE_ENABLED=true
```

Supabase Edge Function secrets:

```text
OPENAI_API_KEY=<server-only secret>
OPENAI_TUTOR_MODEL=<approved current model>
TUTOR_AI_ALLOWED_ORIGINS=https://hrizz67.github.io
TUTOR_AI_GENERATIVE_ENABLED=true
TUTOR_AI_U18_COMPLIANCE_CONFIRMED=true
TUTOR_AI_SAFETY_SALT=<long-random-server-only-secret>
```

The OpenAI key must never use a `VITE_` prefix and must never be committed to Git.

## Deployment sequence

1. Keep all switches false while reviewing the function and privacy contract.
2. Configure approved OpenAI data controls, including zero data retention where required.
3. Set Edge Function secrets with `supabase secrets set`.
4. Deploy only the `tutor-ai` function and verify authenticated Premium access.
5. Test rejection paths for Free users, logged-out users, personal data, unsafe content, input/output moderation, rate limits and model timeouts.
6. Enable `VITE_TUTOR_AI_REMOTE_ENABLED` in the production build only after the server checks pass.
7. Run a supervised classroom pilot and retain only aggregate, non-identifying evidence.

## Rollback

Set either `TUTOR_AI_GENERATIVE_ENABLED=false` on the server or `VITE_TUTOR_AI_REMOTE_ENABLED=false` in the client build. The local curriculum Tutor AI remains available without deleting learner data or changing saved progress.
