# P1.10 Cloudflare Workers AI real STT path

P1.10 replaces the P1.9 unconfigured production adapter with a real, opt-in Cloudflare Workers AI path for iOS/iPadOS Bacaan and Bertutur. It remains stacked on P1.9 and does not change the default Web Speech path on desktop, Android or ordinary iOS sessions.

## Runtime flow

The real path is active only when:

1. the browser is iOS/iPadOS WebKit;
2. the URL includes `iosSpeechMode=media-stt`;
3. `VITE_STT_ENDPOINT` was configured at frontend build time; and
4. the learner explicitly presses the voice button.

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

The speech diagnostics export still excludes transcript text, audio bytes/base64, learner identity, device IDs and device labels. It now reports whether the real remote path is active so the export no longer claims “no upload” during a real transcription.

Cloudflare documents that Workers AI customer content is not used to train models or improve services without explicit consent, and that content may be stored when a separate storage service is deliberately used with Workers AI. This Worker does not configure such a service: <https://developers.cloudflare.com/workers-ai/platform/data-usage/>.

## Diagnostics-only mock

The P1.9 deterministic mock remains available only when all of these are present:

```text
?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=<URL-encoded text>
```

That explicit diagnostic mock takes precedence over `VITE_STT_ENDPOINT`. Without `speechDiag=1`, `mockSpeechTranscript` cannot select it.

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

## Deployment handoff — intentionally not executed in P1.10

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

Rebuild the frontend, then open the iPhone test URL without `mockSpeechTranscript`:

```text
https://<frontend-host>/jannati-ai-tutor-v1/?iosSpeechMode=media-stt&speechDiag=1
```

Verify BM, English and Arabic in both Bacaan and Bertutur. Each recording must show `recording -> transcribing -> ready`, return what was actually spoken as an editable candidate, keep `recognizerCreated: false`, and preserve the manual textarea fallback on every failure.
