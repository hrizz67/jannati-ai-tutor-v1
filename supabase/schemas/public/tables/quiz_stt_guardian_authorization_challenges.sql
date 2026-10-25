create table "public"."quiz_stt_guardian_authorization_challenges" (
  "id" bigint generated always as identity primary key,
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "child_id" text not null check (
    length(child_id) between 7 and 200
    and child_id ~ '^child-[A-Za-z0-9._:-]+$'
  ),
  "challenge_token" uuid not null default gen_random_uuid() unique,
  "initial_session_hash" bytea not null check (octet_length(initial_session_hash) = 32),
  "created_at" timestamptz not null default pg_catalog.now(),
  "expires_at" timestamptz not null,
  "used_at" timestamptz,
  check (expires_at > created_at)
);

create index "quiz_stt_guardian_challenge_account_child_created_idx"
  on "public"."quiz_stt_guardian_authorization_challenges" (account_id, child_id, created_at desc, id desc);

alter table "public"."quiz_stt_guardian_authorization_challenges" enable row level security;

revoke all on table "public"."quiz_stt_guardian_authorization_challenges" from public, anon, authenticated;
grant all on table "public"."quiz_stt_guardian_authorization_challenges" to service_role;
