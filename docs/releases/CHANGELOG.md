# Changelog

## 3.12.0 - 2026-09-06

### Admin Console V2

- Adds the protected `#/admin` console with account summaries, customer search, status filters, pagination, customer details, CSV export, and responsive admin layouts.
- Adds server-authorized Premium activation, 30/90/365-day renewal, custom expiry, trials, timed/permanent complimentary access, cancellation, and immediate expiry.
- Adds atomic entitlement, payment-reference, and append-only audit writes with idempotency and server-time renewal rules.
- Keeps `premium_entitlements` as the only access authority, retires the legacy browser write RPC, and removes normal-user access to admin notes, payment records, and audit history.

### Validation

- Full validation passes with 0 errors and 0 warnings; 63/63 unit tests and the production bundle budget pass.
- Supabase dry-run confirms `20260906210000_admin_console_v2.sql` is the only pending migration.

## 3.11.0 - 2026-09-06

### Secure premium administration

- Adds a protected `#/admin/premium` workspace for account search, entitlement summaries, renewal, fixed-expiry changes, cancellation, and complimentary access.
- Establishes `premium_entitlements` as the single server-authoritative Premium source while retaining legacy profile fields only as a compatibility mirror.
- Uses server-validated admin RPCs, row-level security, transaction locks, idempotency keys, and an append-only audit trail for every entitlement change.
- Calculates fixed Malaysian expiry dates at the end of the selected local day and extends active subscriptions from their current expiry.

### Client and Tutor access safety

- Revalidates Premium state after login, account hydration, focus, visibility, reconnect, and server-calculated expiry without granting access from stale local fields.
- Falls back safely to Free access if server verification fails and keeps the authenticated cache bounded to five minutes.
- Aligns the Tutor AI gateway with the same entitlement RPC used by the application so browser and server access decisions cannot diverge.

### Regression protection

- Adds 18 focused entitlement tests plus release-blocking audits for route protection, RLS, audit logging, renewal rules, lifecycle refresh, and Tutor gateway parity.
- Build, 33 unit tests, the complete validation suite, and the Supabase migration dry run pass with 0 errors and 0 warnings.

### Follow-up work

- Run the final admin workflow and responsive acceptance check on real desktop and mobile devices.
- Continue physical verification of the previously reported cross-device learning-data synchronization issue; this release does not alter learner progress records.

## 3.10.2 - 2026-09-06

### Cloud hydration recovery

- Prevents an already child-scoped learner from generating another full legacy backup during every login, avoiding browser-storage quota failures after a valid cloud revision is received.
- Restores cloud account and child snapshots transactionally and rolls back to the complete device snapshot if any write fails.
- Keeps cloud autosave locked and schedules a safe retry whenever device hydration is incomplete, so partial data cannot replace the learner's current progress.
- Makes profile and archive metadata writes idempotent to avoid unnecessary storage pressure.
- Adds safe hydration-stage diagnostics without logging learner data or other personally identifiable information.

### Regression protection

- Adds quota-failure tests covering transactional rollback, unchanged learner XP, contained legacy-backup failure, and already-scoped migration.
- Extends the release-blocking login hydration audit to require rollback, retry, autosave locking, and staged diagnostics.
- Build, 15 unit tests, and the complete validation suite pass with 0 errors and 0 warnings.

### Follow-up work

- Physically verify matching XP and revision on desktop and mobile for the same Fayyadh child profile after deployment.
- Complete real-device Safari, microphone, audio, RTL, and accessibility acceptance checks.

## 3.10.1 - 2026-09-06

### Login and account hydration

- Opens the authenticated learner dashboard from the correct account-scoped device snapshot without waiting indefinitely for Supabase profile and learning-data requests.
- Moves cloud hydration behind an eight-second timeout with abort support and a safe automatic retry.
- Keeps cloud autosave locked until the remote learning snapshot has been read and classified, preventing an incomplete login from overwriting cloud progress.
- Deduplicates simultaneous auth callbacks and releases stale in-flight hydration when a learner logs out and signs in again.
- Prevents background hydration retries from returning an active learner to the dashboard or interrupting a quiz.
- Clears prior-account revision metadata during an actual account switch.

### Regression protection

- Adds focused unit tests for successful, partial-failure, and timed-out account hydration.
- Adds a release-blocking login hydration regression covering local-first dashboard entry, bounded cloud wait, autosave locking, safe retry, auth deduplication, and account metadata isolation.
- Extends cloud reads to accept an abort signal while retaining compatibility with revisioned and legacy read-only RPCs.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Twelve unit tests and all account, child-isolation, access-control, learning-sync, performance, build, and bundle gates pass.

### Follow-up work

- Physically verify the previously reported desktop/mobile Supabase XP mismatch with the same account and child profile after deployment.
- Complete real-device Safari, microphone, audio, RTL, and accessibility acceptance checks.

## 3.10.0 - 2026-09-06

### Controlled hardening batches 1-5

- Centralized child identity and child-scoped storage so same-name profiles, account changes, logout, deletion, restore, Tutor AI memory, analytics, rewards, and resume state use stable account/child boundaries.
- Added guarded legacy migration and archive/undo recovery paths without removing historical learner data automatically.
- Hardened Free/Premium access, Malaysia-day quota counting, parent verification, answer reveal policy, language handling, and Tutor AI safety boundaries.
- Added controlled interactive-question coverage and preserved canonical answers, scoring, question identifiers, and the 4,530-question bank.
- Extracted authoritative Premium access into a dedicated hook and service-worker registration into a version-derived service.
- Isolated finish-screen CSS while preserving the existing cascade and visual design.

### Quality controls

- Added ESLint with React hook checks and a focused correctness configuration.
- Added Vitest with nine unit tests for date, quota, access, answer safety, child identity, analytics, storage isolation, and service-worker versioning.
- Added architecture, child-isolation, parent-mode, profile/date/quota, and Tutor-language/reveal regression gates.
- Added progressbar semantics and retained keyboard, modal-focus, Arabic direction, and vertical-ordering accessibility behaviour.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Resolve and physically verify the previously reported cross-device Supabase XP mismatch before wider beta.
- Add a small Playwright smoke suite after stable test accounts and browser fixtures are available.
- Continue reducing large production chunks; initial JavaScript is 880.05 kB against a 900 kB budget.
- Complete real-device Safari, microphone, audio, RTL, and accessibility acceptance checks.

## 3.9.7 - 2026-08-28

### Question bank quality

- Repaired 128 high-confidence semantic ambiguities across English, Science, and Arabic while preserving canonical answers and question identifiers.
- Repaired 246 weak distractors across 82 objective questions and removed the remaining answer-position bias patterns.
- Aligned 1598 difficulty labels and 1503 cognitive-demand labels with the actual work required from pupils.
- Added deterministic option ordering and dedicated semantic-uniqueness and distractor-difficulty release gates.
- Removed three misleading KBAT labels from direct-identification Bahasa Melayu questions instead of inflating their cognitive level.

### Safety

- Question count remains 4530 across 8 subjects and 84 topics.
- Scoring, adaptive/mastery behaviour, question IDs, and learner progress data are unchanged.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14814 informational item(s).
