create table if not exists "public"."quiz_stt_guardian_consent_events" (
  "id" bigint generated always as identity primary key,
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "child_id" text not null check (length(child_id) between 7 and 200 and child_id ~ '^child-[A-Za-z0-9._:-]+$'),
  "consent_token" uuid not null default gen_random_uuid() unique,
  "decision" text not null check (decision in ('granted', 'revoked')),
  "notice_version" text not null check (length(notice_version) between 1 and 64 and notice_version ~ '^[a-z0-9._-]+$'),
  "created_at" timestamptz not null default pg_catalog.now()
);

create index if not exists "quiz_stt_guardian_consent_account_child_created_idx"
  on "public"."quiz_stt_guardian_consent_events" ("account_id", "child_id", "created_at" desc, "id" desc);

alter table "public"."quiz_stt_guardian_consent_events" enable row level security;
revoke all on table "public"."quiz_stt_guardian_consent_events" from public, anon, authenticated;
grant all on table "public"."quiz_stt_guardian_consent_events" to service_role;
