# P1.10 Cloudflare Workers AI real STT path

P1.10 introduced the real Cloudflare Workers AI path for Bacaan and Bertutur. P1.12 enabled production iOS/iPadOS activation, and P1.12.1 extends the same safe MediaRecorder path to supported Android phones and tablets when a valid `VITE_STT_ENDPOINT` is present. Desktop retains its existing Web Speech behavior. The selected iOS/Android mobile flow never silently falls back to Web Speech; when media transcription is unavailable, the editable manual input remains available.

P1.12.1 is a production-safe Android workaround for the observed later-question stall/no-transcript symptom. It does not assert that Android and iOS share the same root cause.

## Runtime flow

The real path is active only when:

1. the browser is iOS/iPadOS WebKit, or identifies as Android and supports both `MediaRecorder` and `getUserMedia`;
2. a valid `VITE_STT_ENDPOINT` was configured at frontend build time; and
3. the learner explicitly presses the voice button.

The diagnostic override `?iosSpeechMode=media-stt` still forces the media path on iOS/iPadOS. `?iosSpeechBypass=1` explicitly forces the iOS manual fallback. Android production activation requires the configured endpoint and recording capabilities; desktop remains unchanged. Production learners do not need a query parameter.

The flow is:

```text
MediaRecorder Blob
  -> HTTPS POST to VITE_STT_ENDPOINT
  -> Cloudflare Worker request guards
  -> AI binding
  -> @cf/openai/whisper-large-v3-turbo
  -> editable, unscored transcript candidate
  -> explicit learner confirmation
  -> existing local scoring
```

The browser sends no Cloudflare account ID, API token, AI credential, cookie or authorization header. The configured endpoint must be HTTPS (except loopback development) and cannot contain URL credentials, query parameters or fragments. Cloudflare credentials remain behind the Worker AI binding.

## Request contract and guards

The frontend sends the recorded Blob as the request body with its browser-provided `Content-Type` and an `X-STT-Language` header. The Worker accepts only `POST /v1/transcribe` from an exact origin in `CORS_ALLOW_ORIGINS` and enforces:

- exact CORS origin matching with no wildcard;
- `POST`/`OPTIONS` only;
- `audio/mp4`, `audio/webm`, `audio/mpeg`, `audio/wav`, `audio/x-wav` or `audio/ogg`;
- a 5 MiB maximum body size, checked before and after reading;
- BM (`ms`, `ms-MY`), English (`en`, `en-MY`, `en-US`, `en-GB`) or Arabic (`ar`, `ar-MY`, `ar-SA`) only;
- a configured `AI` binding;
- a fail-closed Cloudflare Rate Limiting binding capped at 60 accepted transcription requests per minute per allowed origin and Cloudflare location;
- generic, content-free errors and `Cache-Control: no-store` responses.

The language sent to Whisper is normalized to `ms`, `en` or `ar`. Voice activity detection is enabled, and previous-text conditioning is disabled for the short independent clips used by Jannati.

## Privacy boundary

Audio exists in the browser only as the in-memory P1.9 Blob, then as the in-memory Worker request and AI binding input. The Worker has no KV, R2, D1 or Durable Object binding, makes no storage call, produces no audio/transcript log, and returns only transcript text plus non-sensitive model/language metadata. The app does not persist the audio.

The speech diagnostics export still excludes transcript text, audio bytes/base64, learner identity, device IDs and device labels. It reports `platformFamily`, activation reason, endpoint availability, provider, remote-upload state and `recognizerCreated: false`, so it does not claim “no upload” during a real transcription.

Cloudflare documents that Workers AI customer content is not used to train models or improve services without explicit consent, and that content may be stored when a separate storage service is deliberately used with Workers AI. This Worker does not configure such a service: <https://developers.cloudflare.com/workers-ai/platform/data-usage/>.

## Diagnostics-only mock

The deterministic mock remains diagnostics-only. It requires both `speechDiag=1` and a non-empty `mockSpeechTranscript`. When no production endpoint is configured, add the explicit media flag to force the iOS media path:

```text
?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=<URL-encoded text>
```

When a valid production endpoint is already configured, `iosSpeechMode=media-stt` is optional. The explicit diagnostic mock takes precedence over `VITE_STT_ENDPOINT`, performs no real fetch, and cannot be selected without `speechDiag=1`.

## Free-tier operating envelope

The Worker uses `@cf/openai/whisper-large-v3-turbo` through the `AI` binding. Cloudflare currently lists Workers AI on Free and Paid plans, a 10,000-neuron daily free allocation, and 46.63 neurons per audio minute for this model. Limits and pricing can change; verify them before deployment:

- <https://developers.cloudflare.com/workers-ai/platform/pricing/>
- <https://developers.cloudflare.com/workers-ai/platform/limits/>
- <https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/>
- <https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>

## Validation

```powershell
npm run test:stt
npm run test:worker
npm run validate:stt-credentials
npm run lint
npm test
npm run validate
npm run build
```

For the strict production build, set `VITE_STT_ENDPOINT` to the final HTTPS Worker URL as well as the existing Supabase build variables.

## Deployment handoff

The Worker was deployed earlier for the physical P1.10 test. No new Worker deployment or production frontend deployment was performed in this change.

From the repository root:

```powershell
npx wrangler@latest login
npx wrangler@latest whoami
```

Before deployment, set `CORS_ALLOW_ORIGINS` in `workers/stt/wrangler.jsonc` to the exact frontend origin. The committed production origin is `https://hrizz67.github.io`. For a physical test through a temporary Cloudflare Tunnel, append that exact temporary origin, comma-separated, and remove it after the test.

Then deploy the Worker only after approval:

```powershell
npx wrangler@latest deploy --config workers/stt/wrangler.jsonc
```

Copy the resulting HTTPS URL into the frontend build environment:

```text
VITE_STT_ENDPOINT=https://jannati-ai-tutor-stt.<workers-subdomain>.workers.dev/v1/transcribe
```

Rebuild the frontend, then open the iPhone and Android test URL without a media-mode query parameter:

```text
https://<frontend-host>/jannati-ai-tutor-v1/
```

Add only `?speechDiag=1` when a privacy-filtered diagnostic export is needed. Verify BM, English and Arabic in both Bacaan and Bertutur on iPhone and Android. Each recording must show `recording -> transcribing -> ready`, return what was actually spoken as an editable candidate, keep `recognizerCreated: false`, and preserve the manual textarea fallback on every failure. The export reports `production-ios-auto` on iOS, `production-android-auto` on supported Android, and `explicit-ios-media-stt-flag` when the iOS force flag is present. The combined physical iPhone + Android regression remains pending.
