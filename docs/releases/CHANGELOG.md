# Changelog

## 3.13.35 - 2026-10-24

### Quiz STT rollout controls

- Added an explicit production-build Quiz MediaRecorder-STT opt-in while keeping automatic activation disabled.
- Added registered-account server authentication, exact production CORS, per-account/global rate limits, bounded audio handling, and a dedicated emergency kill switch.
- Added a fail-closed Durable Object quota of 100 AI inference reservations per UTC day without storing account identity, audio, transcripts, or learner content.
- Changed voice consent to a single-recording acknowledgement that must be repeated for every retry or new recording.

### Preserved boundaries

- Production Quiz Worker remains OFF pending free-plan, live security/quota, and physical-device gates.
- Manual typing, native Quiz speech where supported, and existing Bacaan/Bertutur behavior remain available.
- No Supabase schema/RPC, reward, Premium/payment, shared STT Worker, dependency, or question-bank change.

### Quality snapshot

- 1,054 unit tests pass; validation reports 0 errors and 0 warnings.
- 8 subjects, 84 topics, and 4,530 questions remain validated.
- Tagged-production-equivalent initial JavaScript 869.22 / 900 kB; entry 304.52 / 350 kB; largest lazy chunk 459.49 / 480 kB.
- iPhone Safari, Android Chrome, VoiceOver, and TalkBack acceptance remain NOT RUN.
