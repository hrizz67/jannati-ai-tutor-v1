# Jannati Multilingual Voice Engine V1

The application uses one browser voice boundary in `src/ai/voice/browserVoiceProvider.js`. UI components and learning flows must call `voiceEngine.js`; they must not call `speechSynthesis` or construct `SpeechSynthesisUtterance` directly.

## Supported language policy

- Malay: `ms-MY`, with Yasmin then Osman preferred when installed.
- English: `en-GB`, then `en-US`, `en-AU`, and another English voice.
- Arabic: `ar-SA`, `ar-EG`, `ar-AE`, `ar-KW`, `ar-QA`, `ar-JO`, and another Arabic voice.
- A matching installed voice is preferred. When a mobile browser exposes an empty or incomplete voice list, the engine leaves `utterance.voice` unset and supplies the requested locale so the operating system can select its native voice.
- An English or Indonesian voice is never selected explicitly as a Malay replacement. A real `language-unavailable`, `voice-unavailable`, or `synthesis-unavailable` event returns `VOICE_NOT_AVAILABLE` with device setup guidance.

Explicit lesson, question, subject, or caller language wins over automatic text detection. Mixed Malay/English and Arabic-script text is split into sequential segments so the matching installed voice reads each segment without overlap.

## Public API

`speak`, `stop`, `pause`, `resume`, `replay`, `isSpeaking`, `getAvailableVoices`, and `getVoiceStatus` are exported by `voiceEngine.js`. Speech requests return a controlled result code rather than an ambiguous boolean.

The implementation uses the free Web Speech API only. `FUTURE_NEURAL_VOICES` is an intentionally empty configuration boundary for a future provider.

During local development, `window.__JANNATI_VOICE_DEBUG__` exposes the public controls and current status for device testing. It is not installed in production builds.
