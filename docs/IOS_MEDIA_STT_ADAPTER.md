# Mobile MediaRecorder-to-STT adapter path

P1.9 introduced the iOS/iPadOS WebKit adapter path for Bacaan and Bertutur. P1.12 activates it automatically on iOS when a valid production endpoint is configured. P1.12.1 reuses the same bounded capture/adapter path on supported Android phones and tablets, while desktop behavior remains unchanged.

The Android change is a production-safe workaround for a similar later-question stall/no-transcript symptom. It does not claim that the Android and iOS root causes are the same.

## Runtime boundary

The alternate path is automatically active when all of these conditions are true:

- the browser identifies as iOS/iPadOS WebKit (including iPad desktop user-agent mode), or identifies as Android and supports `MediaRecorder` plus `getUserMedia`;
- a valid `VITE_STT_ENDPOINT` is configured at frontend build time;
- the learner explicitly presses the voice action.

The query `iosSpeechMode=media-stt` remains an explicit iOS diagnostic force flag. `iosSpeechBypass=1` explicitly forces iOS manual fallback. On the selected iOS/Android mobile flow, an absent or invalid endpoint never causes a fallback to Web Speech: the editable manual textarea remains usable. Explicit `speechDiag=1` Web Speech modes remain available for diagnostics only.

The capture controller obtains a fresh microphone stream and creates a fresh `MediaRecorder` for every capture. A learner can stop early; the hard limits are 20 seconds for Bacaan and 25 seconds for Bertutur. It retains only in-memory `Blob` chunks and the exact browser-provided MIME type, including iPhone `audio/mp4` codec parameters. It stops tracks and removes listeners on completion, error, timeout, cancellation, page hide, component unmount and stale context callbacks. It does not instantiate Web Speech, invoke text-to-speech, share a recognizer, persist audio, create an object URL or enumerate devices.

The narrow adapter contract is:

```js
transcribe({ blob, mimeType, language, context, signal })
```

It returns normalized `{ transcript, confidence, provider, metadata }` and reports only these public error codes: `unsupported`, `permission-denied`, `capture-timeout`, `no-audio`, `no-speech`, `stt-unavailable`, `stt-timeout`, `stt-rate-limited`, `stt-error`, and `cancelled`. Size, duration, timeout and abort guards are enforced before or around provider work.

The production adapter sends transient audio only to the validated `VITE_STT_ENDPOINT`. No provider key, token or authorization credential is included in the browser. If the explicit media flag is used without an endpoint or diagnostic mock, the adapter reports a learner-safe unavailable state and keeps manual input usable.

## Deterministic physical preview

The deterministic adapter exists only for tests and an explicit diagnostic preview. A physical iPhone preview requires all three query values:

```text
?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=<URL-encoded transcript>
```

Example URL pattern:

```text
https://<preview-host>/jannati-ai-tutor-v1/?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=Saya%20suka%20membaca
```

Without both `speechDiag=1` and a non-empty `mockSpeechTranscript`, the deterministic adapter cannot be selected. When a valid endpoint is configured, the mock does not require `iosSpeechMode=media-stt`; when it is absent, the explicit media flag forces the iOS diagnostic path. Diagnostics record transcript length only and report `platformFamily` (`ios`, `android` or `desktop`), activation reason, endpoint availability, provider, remote-upload state and `recognizerCreated: false`. Exports exclude transcript text, Blob/audio content, base64, learner identity, device labels and device identifiers.

The Worker was deployed earlier for the physical P1.10 test. No new Worker deployment or production frontend deployment was performed in this change. The combined physical iPhone + Android regression remains pending.

## Secure backend boundary

The provider implementation lives behind the same adapter contract and the first-party Worker endpoint. The browser must never receive a provider credential. The backend must:

1. accept only allowlisted browser origins over HTTPS;
2. enforce the existing client limits again server-side and reject unexpected MIME types;
3. preserve `audio/mp4` codec parameters instead of transcoding on the client;
4. select an approved STT provider/model for `ms-MY`, English locales such as `en-MY`/`en-US`, and Arabic locales such as `ar-SA`;
5. keep provider credentials in server-side secrets, apply rate limits and redact request logs;
6. avoid retaining audio or transcript content unless a separately reviewed policy explicitly requires it;
7. return only transcript, confidence, a provider identifier and non-sensitive metadata;
8. honor cancellation and bounded timeouts.

Production deployment and any change to the transient audio boundary require separate privacy, security and operational approval.
