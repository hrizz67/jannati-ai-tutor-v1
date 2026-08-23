create table "public"."learning_sync_operations" (
  "operation_id" uuid primary key,
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "device_id" text not null,
  "expected_revision" bigint not null,
  "resulting_revision" bigint,
  "status" text not null check (status in ('applied', 'conflict')),
  "dirty_child_ids" text[] not null default '{}'::text[],
  "submitted_payload" jsonb not null default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now()
);

create index "learning_sync_operations_account_created_idx"
  on "public"."learning_sync_operations" (account_id, created_at desc);

alter table "public"."learning_sync_operations" enable row level security;

create policy "Users can read their own sync operations" on "public"."learning_sync_operations"
  for select to "authenticated"
  using (((select auth.uid()) is not null) and ((select auth.uid()) = account_id));

grant select on table "public"."learning_sync_operations" to "authenticated";
grant all on table "public"."learning_sync_operations" to "postgres", "service_role";
