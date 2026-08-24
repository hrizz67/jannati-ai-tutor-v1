create table "public"."learner_profiles" (
  "id" uuid primary key default gen_random_uuid(),
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "legacy_child_id" text not null,
  "display_name" text not null,
  "school_year" text not null default 'Tahun 2'::text,
  "avatar" text,
  "revision" bigint not null default 0,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "learner_profiles_account_legacy_child_id_key" unique (account_id, legacy_child_id)
);

create index "learner_profiles_account_active_idx"
  on "public"."learner_profiles" (account_id, archived_at, updated_at desc);

alter table "public"."learner_profiles" enable row level security;

create policy "Users can read their own learner profiles" on "public"."learner_profiles"
  for select to "authenticated"
  using (((select auth.uid()) is not null) and ((select auth.uid()) = account_id));

grant select on table "public"."learner_profiles" to "authenticated";
grant all on table "public"."learner_profiles" to "postgres", "service_role";
