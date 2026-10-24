# Jannati AI Tutor 3.13.35 Release Notes

Status: stable
Tag: v3.13.35
Build date: 2026-10-24T11:21:03.435Z

## Registered-account Quiz STT opt-in preparation

- Adds a production-build opt-in path for Quiz MediaRecorder transcription. It remains explicit rather than automatic; ordinary mobile Quiz behavior and editable manual typing remain available.
- Uses a dedicated Quiz STT Worker that authenticates Supabase production sessions server-side and permits registered accounts without a UUID allowlist.
- Preserves exact production CORS, per-account and global rate limits, a 1 MiB audio guard, the eight-second browser capture limit, and a server-side emergency kill switch.
- Adds a strongly consistent Durable Object counter capped at 100 AI inference reservations per UTC day. The counter fails closed and stores only the UTC date and aggregate count.
- Requires a fresh adult or lawful parent/guardian acknowledgement for every short recording. Audio is transient, the transcript remains editable, and Quiz never grades automatically from the transcript.
- Does not change the existing Bacaan/Bertutur Worker, Supabase schema/RPC, rewards, XP, coins, Premium/payment, or any of the 4,530 question contracts.

## Activation boundary

- The dedicated production Quiz STT Worker configuration keeps `QUIZ_STT_PILOT_ENABLED=false` and diagnostics disabled; the reviewed Worker must first be deployed and verified in that OFF state.
- This frontend release does **not** activate Quiz STT for all registered accounts. The query opt-in cannot bypass the server kill switch, authentication, access policy, rate limits, or quota.
- Activation remains blocked until the live Cloudflare account is verified as Free with no paid billing path, the Worker passes an OFF-baseline and controlled security/quota test, and adult-consented physical tests pass on iPhone Safari and Android Chrome.
- Guardian status is self-attested in the current UI; it is not an independently verified or auditable guardian relationship. Product/legal acceptance remains required before broad child use.

## Release readiness

- Unit tests: 1,054 passed across 67 test files.
- Validation: 0 errors, 0 warnings, 14,816 informational items.
- Subjects: 8; topics: 84; questions: 4,530; curriculum coverage: 100%.
- Tagged-production-equivalent bundle: initial JavaScript 869.22 / 900 kB, entry 304.52 / 350 kB, largest lazy chunk 459.49 / 480 kB, Tutor incremental runtime 107.85 / 125 kB.
- Credential safety, build structure, speech/STT regressions, Worker tests, QA-preview isolation, release-pipeline audits, and the production Worker Wrangler dry-run pass.

## Physical acceptance status

- Quiz MediaRecorder-STT on iPhone Safari: **NOT RUN**.
- Quiz MediaRecorder-STT on Android Chrome: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- Five-question microphone lifecycle, latency, retry, quota display, and privacy-indicator clearance: **NOT RUN**.
- Existing native Quiz speech and Bacaan/Bertutur physical regression for this release: **NOT RUN**.
- Automated validation does not prove physical microphone reliability or authorize broad activation.

## Rollback reference

- Last stable production release before this patch: `v3.13.34` at source commit `9e5806af13a414ce7c999d495112c65024febdd1`.
- GitHub Pages before this release: `5a6361fb73498925e2473857f8a35c361ccf7ce7`.
- Frontend rollback must use the repository's immutable tagged deployment path. The Worker can be independently returned to its committed OFF state through the existing kill switch.
