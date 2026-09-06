# Batch 5 Final Project Hardening Report

Date: 2026-09-06

Release candidate: v3.10.0

Scope: Controlled architecture hardening after functional repair Batches 1-4

## 1. Files changed

The combined Batch 1-5 change set touches the application shell, AI/adaptive/gamification engines, dashboards, account and child data services, validation scripts, release metadata, styles, and tests. Batch 5 specifically adds or materially changes:

- `src/App.jsx`
- `src/main.jsx`
- `src/hooks/usePremiumAccess.js`
- `src/services/serviceWorkerRegistration.js`
- `public/service-worker.js`
- `src/components/IconGlyph.jsx`
- `src/dashboard/StudentDashboard.jsx`
- `src/styles/style.css`
- `src/styles/features/finish-screen.css`
- `src/ai/adaptive/adaptiveSessionEngine.js`
- `src/ai/memory/mistakeMemory.js`
- `src/ai/question/questionEngine.js`
- `eslint.config.mjs`
- `vitest.config.mjs`
- `tests/unit/corePolicies.test.js`
- `scripts/validate/architectureHardeningRegression.mjs`
- related existing validation scripts updated to follow the extracted boundaries
- package, lockfile, README badges, release notes, health metadata, and known-issue records

Generated build files and transient validation reports are not architecture source and should not be used as the review surface.

## 2. Architecture extracted

- Authoritative Premium access derivation and profile stamping moved from `App.jsx` to `usePremiumAccess`.
- Service-worker URL construction and registration moved from `main.jsx` to `serviceWorkerRegistration`.
- Service-worker cache identity now derives from the application version query parameter instead of a hand-maintained `v19` suffix.
- Finish-screen styles moved to an isolated feature stylesheet while preserving import order and cascade behaviour.
- State was not duplicated, public component contracts were kept stable, and no framework, backend, design-system, or question-bank rewrite was introduced.

The file length of `App.jsx` is not treated as the success metric because Batches 1-4 also added functional safety logic. The extraction targets high-risk ownership boundaries rather than cosmetic line-count reduction.

## 3. Tests added

Vitest foundation:

- 1 test file and 9 passing unit tests.
- Malaysia calendar boundary.
- quota event deduplication.
- cross-account Premium fail-closed behaviour.
- protected answer-reveal threshold.
- exact punctuation answer handling.
- same-name child and Tutor conversation isolation.
- canonical analytics normalization.
- wrong-child snapshot rejection.
- version-derived service-worker URL.

New focused regression gates cover architecture hardening, child data isolation, parent mode, profile/date/quota policy, and Tutor language/answer-reveal policy. All pre-existing custom regression scripts remain.

## 4. Accessibility fixes

- Vertical ordering controls retain explicit `ke atas` and `ke bawah` labels.
- Student accuracy progress exposes `role="progressbar"`, label, minimum, maximum, and current value.
- Keyboard interaction, modal focus trap, Escape/focus restoration, and live feedback remain protected by source-level regression checks.
- Arabic text retains explicit `lang="ar"` and `dir="rtl"` semantics.
- Existing disabled-state and focus styling was preserved; no visual redesign was made.

## 5. Performance impact

- Lazy Tutor AI and subject-bank loading remain intact.
- Supabase and Tutor AI remain deferred from initial HTML.
- No new eager subject-bank import was introduced.
- Initial JavaScript is 880.05 kB against a 900 kB budget.
- Entry chunk is 323.06 kB against 350 kB.
- Largest chunk is 459.49 kB against 480 kB.
- Tutor AI chunk is 21.24 kB against 25 kB.

All budgets pass, but the initial and largest-chunk margins are small and remain P2 optimization work.

## 6. Bundle and build results

- ESLint: PASS, 0 errors and 0 warnings.
- Vitest: PASS, 9/9 tests.
- Architecture hardening regression: PASS.
- Full `npm run validate`: PASS, 0 errors, 0 warnings, 14,816 informational items.
- Question bank: 4,530 questions across 8 subjects and 84 topics.
- Curriculum coverage: 100%.
- Production `npm run build`: PASS.
- Build asset verification: PASS, 21 referenced assets.
- Bundle budget audit: PASS.
- Release artifact alignment for v3.10.0: PASS.

The full configured prevalidation chain executed: architecture, voice, Tutor AI, generative gateway, language/reveal, parent mode, answer submission, question presentation, interactive question gates, resume, learning materials, finish screen, responsive text, learning sync, child isolation, access, date/quota, adaptive session, question/content audits, learning journey, browser/device readiness, performance, classroom pilot, and release pipeline. The main validator and production build then ran again through the release pipeline.

## 7. Deferred items

- Playwright end-to-end tests were not installed or executed. Stable authentication, Supabase test accounts, voice fixtures, and browser/device fixtures should be defined first; forcing browser tooling now would create false confidence and additional moving parts.
- Physical iPhone/Safari microphone, audio, software-keyboard, safe-area, RTL, touch, offline, and focus checks were not executed by automation. The readiness validator verifies implementation and protocol only.
- Live Supabase convergence between desktop and mobile remains unverified after a previously observed XP mismatch.

## 8. Remaining risks

- P0 for wider beta/public release: live cross-device learner progress must converge for the same account and child, including logout/login, offline recovery, conflict resolution, and deletion/undo. Automated tests pass, but the reported production mismatch is not yet closed with two-device evidence.
- P1: no browser-driven smoke suite for the seven critical flows; add a small Playwright suite after fixtures are stable.
- P1: complete physical-device acceptance for Safari, speech, keyboard, RTL, and accessibility.
- P2: reduce initial JavaScript and the largest subject chunk before they reach current budgets.
- P2: continue moving inferred curriculum metadata to teacher-reviewed explicit metadata.

## 9. Readiness decision

- Ready for closed beta: YES, with monitoring, backups, recoverable test profiles, and restricted testers.
- Ready for wider beta: NO, pending live two-device sync evidence and critical-flow browser/physical-device acceptance.
- Ready for paid public release: NO.
- Production ready: NOT CLAIMED.

Batch 5 acceptance is met for controlled code hardening: all available automated validators and the production build pass, lint and focused unit tests are active, service-worker versioning is deterministic, accessibility semantics improved, and no behavioural rewrite was performed. This does not supersede the open live-sync blocker.
