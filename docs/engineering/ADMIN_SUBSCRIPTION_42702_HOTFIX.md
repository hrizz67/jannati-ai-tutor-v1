# Admin Subscription RPC PostgreSQL 42702 Hotfix

Date: 10 September 2026
Final implementation status: `PASS_WITH_LIMITATIONS`

## Root cause

The applied migration `supabase/migrations/20260907090000_admin_subscription_recovery.sql` declares RPC input parameters named `payment_method`, `payment_reference`, and `payment_status`. Its `premium_payment_records` insert returned those same unqualified identifiers from `RETURNING jsonb_build_object(...)` at lines 217-218.

PostgreSQL therefore could not determine whether each name referred to a PL/pgSQL input parameter or an inserted table column and raised `42702 ambiguous_column`. The exact colliding identifiers were:

- `payment_method`
- `payment_reference`
- `payment_status`

The remaining returned columns (`id`, `amount`, `currency`, and `created_at`) are also qualified in the repair to make the inserted-row source explicit and prevent future variable collisions.

## Repair

New forward migration:

`supabase/migrations/20260910090000_admin_subscription_payment_returning_fix.sql`

The migration recreates `public.admin_apply_subscription_change()` with the same PostgREST-visible name, parameter names, order, defaults, authorization, validation, entitlement calculation, advisory locks, request-id idempotency, writes, response, and grants.

The payment insert now aliases its target as `pr`, and every field in the payment `RETURNING` payload is qualified as `pr.id`, `pr.amount`, `pr.currency`, `pr.payment_method`, `pr.payment_reference`, `pr.payment_status`, and `pr.created_at` at lines 106-111.

The matching declarative schema definition was updated to prevent schema drift. The already-applied production migration was not edited.

## Transaction safety

The entitlement update, profile access update, payment record, and admin audit record remain in the same PL/pgSQL RPC invocation and transaction, in that order. No exception handler suppresses the `42702` error. PostgreSQL therefore aborted and rolled back the failed statement instead of committing a partial entitlement or profile change. The production verification result `not_found` is also consistent with the payment/audit writes not having committed.

The existing failed production request ID remains reusable. It is not embedded in source or tests, and no replacement request was generated.

## Regression coverage

`scripts/validate/adminSubscriptionSql42702Regression.mjs` verifies:

1. The RPC signature and behavior remain unchanged apart from the target alias and qualified returned columns.
2. No ambiguous unqualified payment-returning identifier remains.
3. Advisory locks, global request-id replay, payment validation, and atomic write order remain present.
4. The applied migration remains untouched and the declarative schema matches the repair.
5. Automated test sources do not contain the production request-ID prefix.

`scripts/validate/adminSubscriptionSql42702DatabaseCheck.mjs --linked` executes an opt-in, rollback-only database matrix using synthetic request IDs:

1. `ACTIVATE_PREMIUM`, 30 days, `duitnow`, `waived`, and null payment reference executes without `42702`.
2. A paid transaction with a valid reference succeeds.
3. A paid transaction without a reference returns `payment_reference_required` and writes nothing.
4. Replaying the successful request ID is idempotent, creates no duplicate payment/audit record, and does not extend Premium twice.
5. Verification finds the entitlement, payment, and audit records.

The entire database check, including the temporary function replacement and test data, ended with `ROLLBACK`. No Premium renewal or test record was committed.

## Validation results

- `npm run validate:admin-sql-42702`: PASS
- `npm run validate:admin-premium`: PASS
- `npm run validate:admin-console`: PASS
- Linked Supabase rollback matrix: PASS
- `npx supabase db push --dry-run`: PASS; only `20260910090000_admin_subscription_payment_returning_fix.sql` is pending
- `npm run validate`: PASS; 182 unit tests passed, 0 validation errors, 0 warnings
- `npm run build`: PASS
- Production bundle budget: PASS

## Production status and controlled recovery

The migration has **not** been applied to production by this hotfix preparation. Consequently, the production failure remains until the migration is reviewed, committed, deployed, and applied.

After migration deployment:

1. Verify the original request ID still returns `not_found`.
2. Retry exactly the same original request ID once through the controlled Admin recovery flow.
3. Verify the result is `success` and confirms entitlement, payment, and audit records.

Do not create a replacement request ID and do not perform an automatic Premium renewal.

Final status: `PASS_WITH_LIMITATIONS` — the code and rollback-only database execution pass, but production migration application and the authorized manual retry are intentionally pending.
