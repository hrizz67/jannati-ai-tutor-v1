# Changelog

## 3.13.34 - 2026-10-23

### Production deployment smoke repair

- Verifies the deployed entry and every expected production JavaScript chunk against the local release build rather than scanning only the entry chunk.
- Detects missing, stale, redirected, cross-origin, or mixed-release lazy chunks before accepting a GitHub Pages deployment.
- Applies the existing Supabase production guard to the combined verified build and checks Auth health plus production-origin CORS without exposing credentials.
- Adds focused regression coverage for entry-only and lazy-only configuration, missing/stale chunks, wrong origins, conflicting or forbidden configuration, and Auth health failures.
- Explicitly keeps automatic Quiz MediaRecorder-STT disabled in tagged production builds while preserving the previous mobile Quiz speech behavior and manual typing fallback.

### Release safety

- Keeps the failed `v3.13.33` tag immutable; the patch advances through a new `v3.13.34` release path.
- Makes no application-runtime, question-bank, Supabase schema/RPC, reward, Premium/payment, STT Worker, or dependency change.
- Keeps Quiz STT activation and physical mobile acceptance blocked pending separate authorization and evidence.

### Quality snapshot

- 1,050 unit tests pass, including 12 focused smoke-deployment tests and a tagged-production Quiz STT disable regression.
- 8 subjects, 84 topics, and 4,530 questions validate with 0 errors and 0 warnings.
- Production-equivalent initial JavaScript is 869.33 / 900 kB; entry is 304.29 / 350 kB; largest lazy chunk is 459.49 / 480 kB; Tutor incremental runtime is 107.94 / 125 kB.
