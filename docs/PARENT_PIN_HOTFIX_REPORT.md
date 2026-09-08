# Parent PIN runtime hotfix

Date: 2026-09-08. Baseline: v3.12.1, commit `282459f`. Release target: **v3.12.2**.

## 1. Root cause and reproduction boundary

The original `ParentAccessGate.handleSubmit` placed secure save, session-attempt cleanup and `onUnlock` in one `try/catch`. `clearParentPinAttempts` called `sessionStorage.removeItem` without containing exceptions. Consequently, a cleanup exception or synchronous unlock-callback exception after successful persistence reached the generic "PIN tidak dapat disimpan dengan selamat" message. The PIN could already exist even though the screen reported a save failure.

Other confirmed code-level gaps:

- Save returned immediately after `setItem`, without readback or verifier validation.
- Verification converted crypto/decode/runtime failures to `false`, allowing them to be counted as wrong PINs.
- Malformed/unreadable records looked like absent PINs; stale setup could overwrite an existing record.
- Async PBKDF2 completion had no mounted/account/child/auth guard; React's busy state alone did not synchronously exclude duplicate submissions.
- The boundary reset unlocked state in a passive effect after account/child changes, and did not include auth-marker changes in its lock identity.

**The user's original intermittent failure on their production browser was NOT reproduced.** This is a defensive repair of verified failure paths, with controlled fault injection against the repaired implementation. Real-browser checks use native Web Crypto and browser storage, not only MemoryStorage mocks. No real account/PIN, learner profile or Supabase record was changed for testing.

## 2. Files changed

- `src/services/parentAccess.js`: typed errors, strict record validation, verified persistence, contained cleanup, recovery binding, capabilities and submission coordinator.
- `src/services/parentAccessStorage.js`: unchanged security-key constant separated from the lazy PIN runtime; existing import API is re-exported.
- `src/components/parent/ParentAccessGate.jsx`: stage-specific messages, current-context guard, synchronous duplicate protection, safe recovery handling and fresh PIN status.
- `src/components/parent/ParentModeBoundary.jsx`: synchronous account/child/auth keyed relock and scoped unlock callback.
- `scripts/validate/parentModeRegression.mjs`: additional failure-path and boundary checks; existing isolation/backup checks retained.
- `tests/unit/parentAccess.test.js`: 47 PIN tests.
- `tests/browser/parent-pin-smoke.html` and `tests/browser/parentPinSmoke.jsx`: development-only native browser diagnostics using the real Gate and Boundary.
- `docs/PARENT_PIN_HOTFIX_REPORT.md`: this report and manual acceptance protocol.

No changes to Parent Dashboard layout, questions, Tutor AI, branding, entitlements, learning sync architecture or learner data. No dependency, package-script or database migration changes. The approved release also updates package/lock versions, README release badge and the four release metadata documents to v3.12.2.

## 3. Before

| Stage | Previous behavior |
| --- | --- |
| PIN validation | 4–6 digits and matching confirmation checked |
| PBKDF2/write | 120000 iterations; success assumed after storage write |
| Readback | Not checked |
| Session cleanup | Exception escaped into save-failure handler |
| Unlock | Callback exception could be reported as failed persistence |
| Verification | Crypto/runtime failures could be marked as incorrect PIN |
| Async context | No invalidation on account/child/auth/unmount |
| Boundary | Account/child relock after rendering via effect |

## 4. After

1. Validate PIN and confirmation; reserve one synchronous submission ticket.
2. Create salted PBKDF2 verifier, retaining the `accountId:pin` material.
3. Confirm current context and unchanged previous record before writing.
4. Read the exact serialized record back; check version, algorithm, iteration count, canonical base64 salt/verifier and their decoded lengths. Derive the verifier again using the submitted PIN and compare it. Check that another tab has not replaced the record during derivation.
5. On readback failure, restore the previous record or remove the new record **only when it is still this operation's record**. Never delete or overwrite a newer tab's record. Remain locked if safe rollback is impossible.
6. Attempt rate-state cleanup without letting removal errors invalidate a successful save.
7. Unlock only for the still-current mounted account/child/auth context. Callback failure after save displays "PIN telah disimpan, tetapi Laporan Ibu Bapa belum dapat dibuka..." and changes the Gate to verification mode.

Stable errors distinguish invalid PIN, missing crypto, unavailable storage, failed write, failed readback, corrupt record, required reauthentication, changed record, unavailable rate storage and post-save/post-verification callback failure. Unknown exceptions receive a generic safe fallback, never their raw message.

Verification counts only an actual `false` result as an incorrect PIN. Crypto/read/storage/corruption failures do not add attempts. If the rate store cannot be safely read/written/cleaned, verification fails closed with a session-storage message; it does not allow unlimited guessing. Setup after a confirmed secure save can still unlock when best-effort attempt cleanup fails.

Recovery still requires a different, later authentication marker. Its receipt is now bound to the previous PIN record's update identity, so failed receipt removal does not permit repeated resets. Successful replacement changes that identity monotonically. Failed recovery storage writes do not log the user out as though recovery had been prepared successfully.

The boundary remounts locked before rendering a different account, child or auth session. The original inactivity timeout remains 10 minutes; explicit locking is unchanged.

## 5. Security impact

- PBKDF2-SHA-256 strength remains **120000 iterations**, random 16-byte salt and 32-byte verifier.
- No plaintext PIN persistence, security-record logging or new telemetry.
- PIN records remain browser-local and account-scoped; they are not child learning records.
- Existing account-snapshot and learning-backup/cloud exclusions remain unchanged and are covered by regression checks.
- No PIN or verifier is migrated/imported/exported with learning data.
- Wrong-PIN cooldown remains three attempts followed by 30 seconds, with the existing capped backoff calculation retained.
- Recovery requires reauthentication; corrupted records cannot silently turn into ordinary first setup.
- Cross-context callbacks and stale/double submissions cannot open another report.

This remains a browser-local privacy gate, not a replacement for server authorization. The existing per-tab sessionStorage rate-limit model is retained.

## 6. Tests added and browser evidence

47 new unit tests cover normal persistence, 4/5/6 digits and leading zeroes, wrong PIN, account-scoped material, invalid inputs, blocked storage getters/writes, dropped writes, readback exceptions, failed readback derivation, safe recovery rollback, concurrent newer-record preservation, strict record fields, unavailable crypto/TextEncoder/base64, insecure context, runtime failures without wrong-attempt counts, post-save cleanup/callback failure, duplicate/stale submissions, stale setup, reauthentication, failed recovery cleanup and rate limits.

Real-browser run: Codex in-app Chromium, localhost secure context. Result: **BROWSER SMOKE PASS (12 checks)**:

1. Secure context, Web Crypto and native local/session storage round trips.
2. Native PBKDF2 save/readback, correct/wrong PIN and plaintext exclusion.
3. Real Gate opens despite injected session cleanup failure.
4. Real Gate reports saved-but-not-opened for an injected throwing callback; PIN remains valid.
5. Duplicate DOM submissions unlock only once.
6. Account change during PBKDF2 cannot unlock the new Gate.
7. Stored PIN opens the actual Parent Dashboard and explicit lock relocks it.
8. Child switch synchronously relocks.
9. Auth-session switch relocks.
10. Account switch relocks.
11. Inactivity callback hides the report. Only the fixture accelerates the 600000 ms timer to 400 ms; production timeout is unchanged.
12. Unavailable storage prevents unlock.

The fixture uses temporary diagnostic identities, removes only their PIN/rate/recovery records, restores injected browser methods in `finally`, and has no production entry point. It is not a deployed diagnostic UI. No large browser-runner dependency was added.

## 7. Validation commands and results

| Command/check | Result |
| --- | --- |
| `npm run lint` | PASS (also run by prevalidate) |
| `npm run test:unit -- --reporter=dot` | PASS: 153 tests, 7 files; 47 new PIN tests |
| `npm run validate` | PASS: full prevalidate suite plus 0 errors, 0 warnings |
| `node scripts/validate/parentModeRegression.mjs` | PASS |
| `node scripts/validate/learningSyncRegression.mjs` | PASS (also in prevalidate) |
| `node scripts/validate/childDataIsolationRegression.mjs` | PASS (also in prevalidate) |
| `node scripts/validate/accessControlAudit.mjs` | PASS (also in prevalidate) |
| `npm run build` | PASS including production bundle-budget audit |
| Browser runtime diagnostics | PASS: 12 checks with real Gate/Boundary |
| `git diff --check` | PASS |

This repository has no `npm run test` script. Its existing `test:unit` script was used instead; no redundant script was added.

The first hotfix build exceeded the existing 900 KB initial-JavaScript budget (900.01 KB). Moving only the Parent security-key constant into its own module allowed PIN code to remain in the lazy Parent path. Final initial JavaScript: **891.20 KB / 900 KB**; entry: **328.91 KB / 350 KB**. No budget or cryptographic protection was relaxed.

Regression success does not establish that the previously reported real-device learning-sync issue is resolved; that separate issue is outside this hotfix.

## 8. Remaining limitations and release status

- Original affected production browser, branded Chrome/Edge profiles, Safari/iOS and device-specific privacy policies still require manual acceptance below. In-app Chromium checks are not evidence of execution on those physical devices.
- Native login/logout recovery through the live authentication provider and a full ten-minute hardware inactivity run remain manual checks. Automated recovery uses deterministic markers; browser inactivity uses an accelerated fixture timer.
- HTTPS or a supported localhost secure context is required. Browser policy that blocks storage/crypto cannot be repaired by JavaScript; there is no insecure fallback.
- PIN is intentionally **not synced between desktop and mobile**. Each browser/account has its own PIN. This hotfix does not alter learning synchronization.
- A recovery receipt created before this hotfix lacks the new record binding and must be requested again through "Lupa PIN". A closed tab may also lose session-scoped recovery.
- If storage refuses safe rollback after a write, access stays locked and the UI does not claim "no changes saved". Reopen the Parent area and verify the PIN, or use reauthentication recovery. Do not clear all browser storage, since it can contain unsynced learning data.
- This change separates callback failures from persistence failures; it does not introduce a general-purpose React descendant-render error boundary.
- Release target **v3.12.2** follows the approved branch/PR/CI/tag deployment workflow. This report records local evidence; successful GitHub Actions deployment and production smoke testing must be confirmed separately. Original-device/browser-specific acceptance is not yet claimed.

## 9. Manual browser verification

Run the test fixture without a new dependency:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/jannati-ai-tutor-v1/tests/browser/parent-pin-smoke.html` in a supported browser and click **Run browser checks**. Expect all 12 checks to pass. Use the application flow below on a designated test account; do not disclose a real PIN or export security records as evidence.

### A. First setup

1. Log in and open **Ibu Bapa** in the same browser.
2. Create a matching 4–6 digit PIN; confirm that the Parent Dashboard opens.
3. Refresh. Expect **Masukkan PIN ibu bapa**, not a new setup screen.
4. Enter the same PIN and confirm the report opens.

### B. Wrong PIN

1. Lock and enter one incorrect valid-length PIN; expect rejection and a locked report.
2. Enter the correct PIN before reaching the cooldown; expect unlock.
3. Separately enter three incorrect PINs; expect a 30-second cooldown. After expiry, the correct PIN should unlock.

### C. Storage persistence

1. Refresh and reopen the same account in the same ordinary browser profile.
2. Confirm the existing PIN still unlocks. Never inspect or share the salt/verifier record as proof.
3. A different browser profile/device is expected to need its own PIN setup.

### D. Child/account isolation

1. Unlock, switch child, then reopen Parent mode; expect relock.
2. Log out, log into a different designated test account and open Parent mode; the first account's PIN record must not be reused.
3. Return to the original account and confirm its existing PIN remains valid.

### E. Lock behavior

1. Use **Kunci Sekarang**; report must disappear immediately.
2. Unlock, leave the report untouched for ten minutes, then confirm automatic relock.
3. Repeat with interaction before expiry; activity should restart the inactivity countdown.

### F. Recovery

1. Select **Lupa PIN**, complete logout/login for the same account in the same tab, then reopen Parent mode.
2. Set a different matching PIN and confirm the report opens.
3. Lock; old PIN must fail, new PIN must succeed.
4. A reset without new authentication must not be allowed.

Record browser name/version, secure-origin status, failing stage and displayed safe error code/message only. Do not record PINs, verifier/salt values, account email or full security records.
