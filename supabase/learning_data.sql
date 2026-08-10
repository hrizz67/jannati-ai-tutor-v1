-- Jannati AI Tutor: per-account learning data sync
-- Run after supabase/schema.sql in Supabase SQL Editor.

alter table public.profiles
  add column if not exists learning_data jsonb not null default '{}'::jsonb;

create or replace function public.get_learning_data()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(learning_data, '{}'::jsonb)
  from public.profiles
  where id = auth.uid();
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

  insert into public.profiles (id, display_name)
  values (auth.uid(), 'Murid')
  on conflict (id) do nothing;

  update public.profiles
  set learning_data = coalesce(payload, '{}'::jsonb), updated_at = now()
  where id = auth.uid();

  return coalesce(payload, '{}'::jsonb);
end;
$$;

revoke all on function public.get_learning_data() from public;
revoke all on function public.save_learning_data(jsonb) from public;
grant execute on function public.get_learning_data() to authenticated;
grant execute on function public.save_learning_data(jsonb) to authenticated;
