create table "public"."learning_states" (
  "learner_id" uuid primary key references public.learner_profiles(id) on delete restrict,
  "account_id" uuid not null references auth.users(id) on delete cascade,
  "revision" bigint not null default 0,
  "state" jsonb not null default '{}'::jsonb,
  "updated_at" timestamp with time zone not null default now(),
  constraint "learning_states_account_learner_id_key" unique (account_id, learner_id)
);

alter table "public"."learning_states" enable row level security;

create policy "Users can read their own learning states" on "public"."learning_states"
  for select to "authenticated"
  using (((select auth.uid()) is not null) and ((select auth.uid()) = account_id));

grant select on table "public"."learning_states" to "authenticated";
grant all on table "public"."learning_states" to "postgres", "service_role";
