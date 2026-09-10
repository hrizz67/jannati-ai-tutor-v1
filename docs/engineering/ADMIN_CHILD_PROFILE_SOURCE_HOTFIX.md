# Admin Child Profile Source Hotfix

## Status

PASS — implementation, regression coverage, PostgreSQL rollback execution, validation, build, and Supabase dry-run all passed. Release actions were intentionally not performed.

## 1. Root cause

The active application write path, `save_learning_data_v3()`, stores the authoritative full account state in `public.profiles.learning_data` and advances `learning_revision`. Child profile metadata is stored inside the serialized `jannati_cloud_child_state` member of that payload.

The Admin Console RPCs `admin_search_customers()` and `admin_get_customer_details()` still counted and listed children only from `public.learner_profiles`. That normalized table may legitimately contain no rows while the canonical account payload contains valid child profiles. The Admin result of `0 profil anak` therefore represented a read-source mismatch, not lost child learning data.

## 2. Files changed

- `supabase/migrations/20260910140000_admin_child_profile_source_fix.sql`
- `supabase/schemas/public/functions/admin_console_v2.sql`
- `src/admin/AdminPremiumPage.jsx`
- `src/styles/admin-premium.css`
- `scripts/validate/adminChildProfileSourceRegression.mjs`
- `scripts/validate/adminChildProfileSourceDatabaseCheck.mjs`
- `package.json`
- `docs/engineering/ADMIN_CHILD_PROFILE_SOURCE_HOTFIX.md`

## 3. Migration created

`20260910140000_admin_child_profile_source_fix.sql` is a forward-only migration. It creates the protected `admin_child_summary_payload(uuid)` helper and recreates the two Admin read RPCs without changing their public signatures.

The migration contains function-definition and privilege changes only. It performs no data update, backfill, insert, archive, rename, or deletion.

## 4. Previous data source

Admin child counts, child lists, and child-name search were read directly from active rows in `public.learner_profiles`.

## 5. New canonical data source

The server-side helper reads the target account row from `public.profiles`, safely parses `learning_data["jannati_cloud_child_state"]`, and returns only:

- child ID
- display name
- school year
- avatar identifier
- active-child flag
- child count, active child ID, and source label

It does not return the complete `learning_data` value or any child snapshot.

## 6. Fallback behaviour

A valid canonical object containing a `profiles` array is authoritative, including an explicitly empty array. `public.learner_profiles` is used only when canonical child metadata is absent or malformed. Stale normalized rows cannot override a valid canonical state.

## 7. Security behaviour

The helper is `SECURITY DEFINER` with an empty pinned `search_path`. It checks authentication and `is_current_premium_admin()` on the server. Direct execution is revoked from `public`, `anon`, and `authenticated`; only `postgres` and `service_role` receive direct execution rights. Authenticated Admin users continue to use the existing protected Admin RPCs.

No service-role credential is exposed to the frontend. Existing RLS and Admin authorization remain unchanged.

## 8. Same-name child handling

Profiles are distinguished by child ID. Only repeated copies of the same ID are collapsed; children with identical display names and different IDs are both returned and rendered. React uses `child.id` as the list key.

## 9. Active child handling

`activeChildId` is accepted only when it references a usable canonical child. Each returned child receives an explicit `isActive` flag. Deleted children and children whose `archivedAt` is newer than `restoredAt` are excluded. The Admin UI displays a subtle `Aktif` indicator and does not infer activity from a name.

The legacy fallback cannot reliably determine the active child and therefore returns no active-child marker.

## 10. Tests run

- `npm test`: 182/182 tests passed across 8/8 files.
- `npm run validate:admin-child-source`: passed.
- `npm run validate:admin-child-source:linked`: passed all ten requested database scenarios inside an always-rollback transaction using a synthetic account.
- `npm run validate:admin-console`: passed.
- `npm run validate:learning-sync`: passed.
- `npm run validate:cloud-restore`: passed, including 24 unit scenarios and the production-shaped large fixture.
- `npm run validate:child-isolation`: passed, including same-name, account isolation, archive/restore, reload, and offline scenarios.

The linked PostgreSQL matrix covered:

1. two canonical children with zero normalized rows;
2. duplicate display names with distinct child IDs;
3. active child resolution by ID;
4. archived-child exclusion;
5. legacy fallback when canonical metadata is absent;
6. canonical precedence over stale normalized rows;
7. malformed canonical metadata fallback;
8. non-Admin denial;
9. search by a child present only in canonical `learning_data`;
10. exclusion of history, answers, AI memory, snapshots, and the full learning payload.

The database test also confirmed that Admin helper/search/detail reads do not change `learning_data`, `learning_revision`, or `updated_at`. All synthetic test rows and temporary function definitions were rolled back.

## 11. Validation and build

- `npm run validate`: PASS — 0 errors and 0 warnings.
- `npm run build`: PASS.
- Production bundle budget: PASS.
- `npm run supabase:push:dry`: PASS — only `20260910140000_admin_child_profile_source_fix.sql` is pending.

## 12. Limitations

- The production migration has not been applied, as required by the stop-before-release instruction.
- The legacy `learner_profiles` fallback cannot identify the active child because that table has no canonical account-level `activeChildId` field.
- This targeted hotfix intentionally does not redesign or reconcile the normalized learning architecture.

## 13. Production data safety

No production learning data was mutated. The linked database exercise ran within an explicit transaction using generated synthetic identifiers and ended with `ROLLBACK`. No learner-profile backfill is required or performed.

No data migration is required. Releasing the forward function migration is sufficient for Admin child visibility.
