# iOS MediaRecorder-to-STT adapter path

P1.9 adds an opt-in iOS/iPadOS WebKit path for Bacaan and Bertutur. The default experience on desktop, Android and iOS is unchanged.

## Runtime boundary

The alternate path is active only when all of these conditions are true:

- the browser identifies as iOS/iPadOS WebKit (including iPad desktop user-agent mode);
- the query includes `iosSpeechMode=media-stt`;
- the learner explicitly presses the voice action.

The capture controller obtains a fresh microphone stream and creates a fresh `MediaRecorder` for every 4–8 second capture. It retains only in-memory `Blob` chunks and the exact browser-provided MIME type, including iPhone `audio/mp4` codec parameters. It stops tracks and removes listeners on completion, error, timeout, cancellation, page hide, component unmount and stale context callbacks. It does not instantiate Web Speech, invoke text-to-speech, share a recognizer, persist audio, create an object URL, enumerate devices or upload data.

The narrow adapter contract is:

```js
transcribe({ blob, mimeType, language, context, signal })
```

It returns normalized `{ transcript, confidence, provider, metadata }` and reports only these public error codes: `unsupported`, `permission-denied`, `capture-timeout`, `no-audio`, `stt-unavailable`, `stt-timeout`, `stt-error`, and `cancelled`. Size, duration, timeout and abort guards are enforced before or around provider work.

No production provider is configured in P1.9. Therefore ordinary `iosSpeechMode=media-stt` runs capture locally and then report `stt-unavailable`, while the manual textarea remains usable. No provider key, external STT request, audio upload, ffmpeg, WASM or on-device model is included.

## Deterministic physical preview

The deterministic adapter exists only for tests and an explicit diagnostic preview. A physical iPhone preview requires all three query values:

```text
?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=<URL-encoded transcript>
```

Example URL pattern:

```text
https://<preview-host>/jannati-ai-tutor-v1/?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=Saya%20suka%20membaca
```

Without both `speechDiag=1` and a non-empty `mockSpeechTranscript`, the deterministic adapter cannot be selected. Diagnostics record transcript length only. Diagnostic state and exports exclude transcript text, Blob/audio content, base64, device labels and device identifiers.

## Future secure backend adapter

A future provider implementation should live behind the same adapter contract and a first-party authenticated backend endpoint. The browser must never receive a provider credential. The backend should:

1. accept only authenticated, short-lived requests over HTTPS;
2. enforce the existing client limits again server-side and reject unexpected MIME types;
3. preserve `audio/mp4` codec parameters instead of transcoding on the client;
4. select an approved STT provider/model for `ms-MY`, English locales such as `en-MY`/`en-US`, and Arabic locales such as `ar-SA`;
5. keep provider credentials in server-side secrets, apply rate limits and redact request logs;
6. avoid retaining audio or transcript content unless a separately reviewed policy explicitly requires it;
7. return only transcript, confidence, a provider identifier and non-sensitive metadata;
8. honor cancellation and bounded timeouts.

That backend and any external audio transfer require a separate privacy, security and operational review. They are intentionally outside P1.9.
