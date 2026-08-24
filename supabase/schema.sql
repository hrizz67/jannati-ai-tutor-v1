-- Jannati AI Tutor: Free/Premium access foundation
-- Run this once in Supabase Dashboard > SQL Editor.
-- Payment verification remains manual in this first no-cost version.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  access_status text not null default 'free'
    check (access_status in ('free', 'pending', 'premium', 'expired', 'blocked')),
  access_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, access_status)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Murid'), 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- No client update policy is created intentionally. Access status and admin
-- flags are changed manually by the owner in the SQL editor, so a browser
-- user can never upgrade their own account.
revoke insert, update, delete on table public.profiles from anon, authenticated;

-- New public objects must opt in to browser access explicitly.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_profile_updated_at();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_profile_updated_at() from public, anon, authenticated;

-- Manual admin workflow (run only from the SQL editor):
-- update public.profiles
-- set access_status = 'premium', access_expires_at = now() + interval '30 days'
-- where id = '<USER_UUID>';
