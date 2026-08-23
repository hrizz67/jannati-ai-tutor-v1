create table "public"."learning_events" (
  "event_id" uuid primary key,
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "learner_id" uuid references public.learner_profiles(id) on delete restrict,
  "legacy_child_id" text not null,
  "device_id" text not null,
  "event_type" text not null,
  "payload" jsonb not null default '{}'::jsonb,
  "client_created_at" timestamp with time zone,
  "server_created_at" timestamp with time zone not null default now()
);

create index "learning_events_account_cursor_idx"
  on "public"."learning_events" (account_id, server_created_at, event_id);

alter table "public"."learning_events" enable row level security;

create policy "Users can read their own learning events" on "public"."learning_events"
  for select to "authenticated"
  using (((select auth.uid()) is not null) and ((select auth.uid()) = account_id));

grant select on table "public"."learning_events" to "authenticated";
grant all on table "public"."learning_events" to "postgres", "service_role";
