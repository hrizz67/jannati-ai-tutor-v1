create table "public"."learning_data_backups" (
  "id" uuid primary key default gen_random_uuid(),
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "revision" bigint not null,
  "reason" text not null,
  "payload" jsonb not null default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now(),
  constraint "learning_data_backups_account_revision_reason_key" unique (account_id, revision, reason)
);

alter table "public"."learning_data_backups" enable row level security;

create policy "Users can read their own learning backups" on "public"."learning_data_backups"
  for select to "authenticated"
  using (((select auth.uid()) is not null) and ((select auth.uid()) = account_id));

grant select on table "public"."learning_data_backups" to "authenticated";
grant all on table "public"."learning_data_backups" to "postgres", "service_role";
