-- Jannati AI Tutor: isolate Free/Premium access at the database boundary.
-- This migration is intentionally idempotent so it can be reviewed and
-- retried safely if a deployment is interrupted.

begin;

alter table public.profiles
  alter column access_status set default 'free';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, access_status)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Murid'), 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.save_learning_data(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, display_name, access_status)
  values (auth.uid(), 'Murid', 'free')
  on conflict (id) do nothing;

  update public.profiles
  set learning_data = coalesce(payload, '{}'::jsonb), updated_at = now()
  where id = auth.uid();

  return coalesce(payload, '{}'::jsonb);
end;
$$;

-- Existing table permissions were created using Supabase's legacy broad
-- defaults. Browser roles only need SELECT on their own row; RLS continues to
-- enforce the row boundary.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

-- RPC access is explicit. Trigger helpers are not callable by browser roles.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_profile_updated_at() from public, anon, authenticated;
revoke all on function public.get_learning_data() from public, anon, authenticated;
revoke all on function public.save_learning_data(jsonb) from public, anon, authenticated;
grant execute on function public.get_learning_data() to authenticated;
grant execute on function public.save_learning_data(jsonb) to authenticated;

-- Prevent newly created public objects from silently inheriting browser-write
-- or blanket RPC access. Future access must be granted deliberately.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

commit;
