# Admin Console V2 — Transaction Recovery

## Status

This hotfix hardens premium mutations without changing the canonical entitlement architecture. `public.premium_entitlements` remains the source of truth. Browser code can mutate subscriptions only through the server-authorized `admin_apply_subscription_change` RPC.

## Root cause

The confirmation handler set `submitting=true` and awaited the Supabase RPC directly. There was no timeout or abort boundary. If the HTTP/RPC promise never settled, JavaScript never reached `catch` or `finally`; therefore the modal remained at **Menyimpan…** and its controls stayed disabled indefinitely.

The previous client also treated the RPC response as the only proof of success. It had no safe way to distinguish a request that never reached Supabase from a committed transaction whose response was lost.

A later production failure exposed a second edge case: the shared timeout helper aborted the mutation fetch at 12 seconds. That behavior is correct for reads but unsafe for an idempotent write because cancellation can stop the RPC before Supabase creates its audit row. Immediate verification then reports `not_found`, and repeating the same cancelled request can reproduce the failure indefinitely.

## Recovery design

One operation receives one UUID when the admin prepares it. The same UUID is retained through submit, timeout, verification and an allowed retry. A new UUID is created only for a genuinely new action.

The client state machine is:

`idle → confirming → submitting → verifying → success | failed | not_executed | uncertain`

Admin RPC calls have one 12-second UI deadline. Read requests are aborted at that deadline. Mutation requests are **not** aborted: the UI stops waiting for their response, classifies the result as ambiguous, and calls `admin_verify_subscription_request` with the original UUID. Verification retries `not_found` or `in_progress` with bounded 400 ms, 1 s and 2 s backoff before presenting a final recovery state. It never submits a renewal while performing verification.

The unresolved operation metadata stored in `sessionStorage` contains only:

- request ID
- account ID
- action
- start timestamp
- renewal duration, when applicable

Payment details, admin notes, tokens and authority claims are not persisted.

## Server guarantees

`admin_verify_subscription_request(uuid)`:

- requires an authenticated database session;
- verifies the admin role with `is_current_premium_admin()`;
- reads the append-only audit event and payment record by request ID;
- treats the audit event as proof that the encompassing database transaction committed;
- reports `success`, `not_found`, `incomplete`, or `in_progress` with current canonical entitlement metadata;
- performs no mutation.

Request IDs are globally unique in the admin audit log. The mutation takes a request lock followed by the existing per-account advisory transaction lock before checking the ID. Verification tries the same request lock and reports `in_progress` if it is held; its volatile reads observe fresh committed state. A retry with the same account, action and request ID returns the verified prior result. A conflicting reuse of the ID is rejected. Thus an idempotent replay cannot create another entitlement extension, payment row or audit event. `not_found` means absent at the time of verification, not proof that a delayed HTTP request can never arrive; retries must still use the original UUID.

One successful billable operation remains a single transaction containing:

1. one canonical entitlement mutation;
2. one payment/renewal record;
3. one append-only admin audit event.

Any database exception rolls back all three.

## UI behavior

- **Submitting:** confirmation controls are disabled and the UI wait is bounded by the canonical timeout; the idempotent write itself is not aborted.
- **Verifying:** the same request ID is checked repeatedly against server audit/payment records using bounded backoff.
- **Success:** confirmation closes; entitlement, customer details, payment/audit history, search row and summary are refreshed; server expiry is shown.
- **Not executed:** retry uses the original in-memory command and UUID; after reload, the UI shows the retained duration and instructs the admin to re-enter only the omitted payment details before choosing the matching action.
- **Uncertain:** blind retry is disabled. The admin can choose **Semak Status Transaksi** later.
- **Reload/reconnect:** safe pending metadata enables verification; reconnect may verify but never resubmits.

## Security and limitations

RLS and table grants remain unchanged. Normal authenticated users cannot use the verification result because the function verifies `auth.uid()` against server-managed admin membership. No `service_role` secret or direct protected-table write exists in the frontend.

After a full page reload, sensitive/form fields are intentionally not persisted. Payment references, amounts and admin notes remain excluded. If verification returns `not_found`, the admin re-enters the same account/action and confirms the payment details again using the original UUID. Immediate retries in the same page reuse the complete original command. Malformed or mismatched RPC responses remain uncertain until verified. Bounded summary/search/details refreshes do not hold the submission lock after success, and stale detail responses cannot replace another selected customer's data.

## Release preflight

Run `node scripts/validate/adminRecoveryDatabaseCheck.mjs --linked` explicitly with authorized CLI access. It compiles this migration in a transaction, checks unauthenticated/non-admin rejection, checks admin verification and customer details, and tests an existing idempotent replay when an eligible audit row exists. It always rolls back schema changes, never starts a new customer renewal, and uses a 3-second lock timeout and 15-second statement timeout. Temporary SQL is removed after execution; output contains no customer records.

Release v3.12.1 passed this rollback preflight, 106 unit tests (43 recovery), full validation with 0 errors/0 warnings, and production asset/bundle gates. Deployment still applies the pending migration normally; the preflight does not update migration history. Real-device acceptance and newly paid customer renewals are not implied by these checks.
