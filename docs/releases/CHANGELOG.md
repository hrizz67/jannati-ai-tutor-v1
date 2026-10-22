# Changelog

## 3.13.33 - 2026-10-22

### P1.17 authenticated Quiz MediaRecorder-STT readiness

- Adds a dedicated Quiz STT production path with server-validated Supabase authentication, exact-origin CORS, bounded rate limits, a 1 MiB upload limit, and an eight-second browser capture limit.
- Adds an explicit adult, parent, or guardian consent step while preserving editable manual typing and preventing automatic grading of transcripts.
- Keeps the dedicated production Worker disabled by default. General registered-user activation is blocked until consented adult iPhone Safari and Android Chrome physical tests pass.
- Keeps the public query parameter outside the authorization boundary; access remains controlled by the production build policy and server-side Worker policy.

### Scope and safety

- Existing Bacaan/Bertutur, desktop Quiz, Supabase schema/RPC, cloud sync, reward, XP, coins, Premium/payment, and question-bank behavior remain unchanged.
- No audio, transcript, credential, or learner-content persistence is added.
- No paid service, card, quota increase, dependency, or bundle-threshold change is included.
- Physical iPhone Safari, Android Chrome, VoiceOver, and TalkBack acceptance remains not run.

### Quality snapshot

- 1,037 unit tests pass.
- 8 subjects, 84 topics, and 4,530 questions validate with 0 errors and 0 warnings.
- Production-equivalent initial JavaScript is 869.32 / 900 kB; entry is 304.29 / 350 kB; largest lazy chunk is 459.49 / 480 kB; Tutor incremental runtime is 107.94 / 125 kB.
