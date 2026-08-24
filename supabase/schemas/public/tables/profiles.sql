create table "public"."profiles" (
  "id"                uuid                     not null,
  "display_name"      text,
  "access_status"     text                     not null default 'free'::text,
  "access_expires_at" timestamp with time zone,
  "is_admin"          boolean                  not null default false,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  "learning_data"     jsonb                    not null default '{}'::jsonb,
  "learning_revision" bigint                   not null default 0,
  "learning_sync_version" integer              not null default 3,
  constraint "profiles_access_status_check" check ((access_status = ANY (ARRAY['free'::text, 'pending'::text, 'premium'::text, 'expired'::text, 'blocked'::text]))),
  constraint "profiles_id_fkey" foreign key (id) references auth.users(id) on delete cascade,
  constraint "profiles_pkey" primary key (id)
);

alter table "public"."profiles"
  enable row level security;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_profile_updated_at();

create policy "Users can read their own profile" on "public"."profiles"
  for select
  to "authenticated"
  using ((auth.uid() = id));

grant select on table "public"."profiles" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "postgres", "service_role";
