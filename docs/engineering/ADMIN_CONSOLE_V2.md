# Jannati Admin Console V2

## Authority chain

`#/admin` → server-verified `profiles.is_admin` → security-definer RPC →
`premium_entitlements` → payment record + append-only audit → client
entitlement revalidation.

`premium_entitlements` remains the only entitlement authority. Legacy
`profiles.access_status` and `profiles.access_expires_at` are compatibility
mirrors and are never read to grant Premium access.

## Protected data

- Normal accounts receive a sanitized entitlement through
  `get_my_premium_entitlement()` only.
- Direct authenticated reads and writes to entitlement, payment, and audit
  tables are revoked. Admin Console data is returned only by admin-authorized
  RPCs.
- Internal notes, payment references, other customer records, audit actors,
  passwords, tokens, and service-role credentials are never exposed to a
  normal account.
- Child profiles are read-only in the console and are never modified by a
  subscription operation.

## Subscription operations

`admin_apply_subscription_change()` serializes changes per account with a
transaction advisory lock. A request UUID provides idempotency. The canonical
entitlement, compatibility mirror, payment/renewal record, and audit event are
written in one PostgreSQL transaction; any error rolls back all of them.

For an active expiring entitlement, renewal starts from the current expiry.
For an inactive or expired entitlement, renewal starts from the server time.
Custom Malaysian calendar dates are converted to `23:59:59.999` in
`Asia/Kuala_Lumpur` and stored as `timestamptz`.

Trials are represented by `status=trial` and `plan=premium_trial`. Timed
complimentary access uses `status=complimentary`; permanent complimentary
access is represented explicitly by `is_permanent=true` and `expires_at=null`,
never by a synthetic future year.

## Operational limitations

- Payment records are manual bookkeeping only; no bank or payment-provider
  transaction is processed.
- CSV export contains only the current filtered page and approved subscription
  fields.
- Admin-role assignment remains an out-of-band database owner operation; the
  browser has no role-management endpoint.
