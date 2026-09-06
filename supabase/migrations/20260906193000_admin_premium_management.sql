-- Canonical premium entitlement, server-authorized administration and append-only audit.
-- Existing profiles access columns remain a compatibility mirror during migration.

begin;

create table if not exists public.premium_entitlements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'premium',
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null default 'admin',
  notes text,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint premium_entitlements_plan_check check (char_length(trim(plan)) between 1 and 80),
  constraint premium_entitlements_status_check check (status in ('active', 'expired', 'cancelled', 'trial', 'complimentary')),
  constraint premium_entitlements_revision_check check (revision > 0),
  constraint premium_entitlements_source_check check (char_length(trim(source)) between 1 and 120),
  constraint premium_entitlements_notes_check check (notes is null or char_length(notes) <= 2000)
);

create index if not exists premium_entitlements_status_expiry_idx
  on public.premium_entitlements (status, expires_at);

create table if not exists public.premium_admin_audit_log (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  admin_user_id uuid not null,
  target_user_id uuid not null,
  action text not null,
  old_status text not null,
  new_status text not null,
  old_expiry timestamptz,
  new_expiry timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  constraint premium_admin_audit_action_check check (action in (
    'ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY',
    'CANCEL_PREMIUM', 'MARK_COMPLIMENTARY'
  )),
  constraint premium_admin_audit_reason_check check (reason is null or char_length(reason) <= 2000),
  constraint premium_admin_audit_request_key unique (admin_user_id, request_id)
);

create index if not exists premium_admin_audit_target_created_idx
  on public.premium_admin_audit_log (target_user_id, created_at desc);

create or replace function public.touch_premium_entitlement_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists premium_entitlements_updated_at on public.premium_entitlements;
create trigger premium_entitlements_updated_at
  before update on public.premium_entitlements
  for each row execute function public.touch_premium_entitlement_updated_at();

-- Preserve legacy premium accounts. A null legacy expiry represented lifetime
-- access, so it is migrated as complimentary with an explicit far-future UTC
-- timestamp instead of retaining an ambiguous null entitlement.
insert into public.premium_entitlements (
  account_id, plan, status, starts_at, expires_at, source, notes, updated_at
)
select
  profile_row.id,
  'premium',
  case
    when profile_row.access_status = 'premium' and profile_row.access_expires_at is null then 'complimentary'
    when profile_row.access_status = 'premium' and profile_row.access_expires_at > now() then 'active'
    else 'expired'
  end,
  coalesce(profile_row.created_at, now()),
  case
    when profile_row.access_status = 'premium' and profile_row.access_expires_at is null
      then '9999-12-31 23:59:59+00'::timestamptz
    else coalesce(profile_row.access_expires_at, profile_row.updated_at, now())
  end,
  'legacy_profiles_migration',
  case when profile_row.access_expires_at is null then 'Legacy premium tanpa tarikh tamat; dipelihara sebagai complimentary.' end,
  coalesce(profile_row.updated_at, now())
from public.profiles as profile_row
where profile_row.access_status in ('premium', 'expired')
on conflict (account_id) do nothing;

create or replace function public.is_current_premium_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select profile_row.is_admin
    from public.profiles as profile_row
    where profile_row.id = auth.uid()
  ), false);
$$;

create or replace function public.premium_entitlement_payload(target_account_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select jsonb_build_object(
      'accountId', entitlement.account_id,
      'plan', entitlement.plan,
      'storedStatus', entitlement.status,
      'effectiveStatus', case
        when entitlement.status in ('active', 'trial', 'complimentary') and entitlement.expires_at > now()
          then entitlement.status
        when entitlement.status = 'cancelled' then 'cancelled'
        else 'expired'
      end,
      'startsAt', entitlement.starts_at,
      'expiresAt', entitlement.expires_at,
      'source', entitlement.source,
      'notes', entitlement.notes,
      'updatedAt', entitlement.updated_at,
      'updatedBy', entitlement.updated_by,
      'revision', entitlement.revision,
      'accessAllowed', entitlement.status in ('active', 'trial', 'complimentary') and entitlement.expires_at > now(),
      'serverNow', now()
    )
    from public.premium_entitlements as entitlement
    where entitlement.account_id = target_account_id
  ), jsonb_build_object(
    'accountId', target_account_id,
    'plan', 'free',
    'storedStatus', 'free',
    'effectiveStatus', 'free',
    'startsAt', null,
    'expiresAt', null,
    'source', 'none',
    'notes', null,
    'updatedAt', null,
    'updatedBy', null,
    'revision', 0,
    'accessAllowed', false,
    'serverNow', now()
  ));
$$;

create or replace function public.get_my_premium_entitlement()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  return public.premium_entitlement_payload(caller_id);
end;
$$;

create or replace function public.admin_premium_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;

  return (
    select jsonb_build_object(
      'activePremium', count(*) filter (
        where entitlement.status in ('active', 'trial') and entitlement.expires_at > now()
      ),
      'expiringIn7Days', count(*) filter (
        where entitlement.status in ('active', 'trial', 'complimentary')
          and entitlement.expires_at > now()
          and entitlement.expires_at <= now() + interval '7 days'
      ),
      'expired', count(*) filter (
        where entitlement.status in ('expired', 'cancelled')
          or (entitlement.status in ('active', 'trial', 'complimentary') and entitlement.expires_at <= now())
      ),
      'complimentary', count(*) filter (
        where entitlement.status = 'complimentary' and entitlement.expires_at > now()
      ),
      'serverNow', now()
    )
    from public.premium_entitlements as entitlement
  );
end;
$$;

create or replace function public.admin_search_premium_accounts(
  search_text text,
  page_size integer default 20,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_search text := lower(trim(coalesce($1, '')));
  safe_size integer := least(greatest(coalesce($2, 20), 1), 50);
  safe_offset integer := greatest(coalesce($3, 0), 0);
  response_payload jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if char_length(normalized_search) < 2 then raise exception 'search_text_too_short'; end if;

  with candidates as (
    select
      user_row.id as account_id,
      user_row.email,
      coalesce(
        nullif(trim(profile_row.display_name), ''),
        nullif(trim(user_row.raw_user_meta_data ->> 'display_name'), ''),
        split_part(coalesce(user_row.email, ''), '@', 1),
        'Akaun'
      ) as display_name,
      entitlement.plan,
      entitlement.status as stored_status,
      entitlement.starts_at,
      entitlement.expires_at,
      entitlement.source,
      entitlement.notes,
      entitlement.updated_at,
      entitlement.revision,
      entitlement.status in ('active', 'trial', 'complimentary') and entitlement.expires_at > now() as access_allowed,
      case
        when entitlement.account_id is null then 'free'
        when entitlement.status in ('active', 'trial', 'complimentary') and entitlement.expires_at > now() then entitlement.status
        when entitlement.status = 'cancelled' then 'cancelled'
        else 'expired'
      end as effective_status,
      count(*) over() as total_count
    from auth.users as user_row
    left join public.profiles as profile_row on profile_row.id = user_row.id
    left join public.premium_entitlements as entitlement on entitlement.account_id = user_row.id
    where position(normalized_search in lower(coalesce(user_row.email, ''))) > 0
       or position(normalized_search in lower(coalesce(profile_row.display_name, ''))) > 0
       or position(normalized_search in lower(user_row.id::text)) > 0
    order by coalesce(entitlement.updated_at, user_row.updated_at, user_row.created_at) desc, user_row.id
    limit safe_size offset safe_offset
  )
  select jsonb_build_object(
    'accounts', coalesce(jsonb_agg(jsonb_build_object(
      'accountId', candidate.account_id,
      'email', candidate.email,
      'displayName', candidate.display_name,
      'plan', coalesce(candidate.plan, 'free'),
      'storedStatus', coalesce(candidate.stored_status, 'free'),
      'effectiveStatus', candidate.effective_status,
      'startsAt', candidate.starts_at,
      'expiresAt', candidate.expires_at,
      'daysRemaining', case when candidate.access_allowed
        then greatest(0, ceil(extract(epoch from (candidate.expires_at - now())) / 86400.0)::integer)
        else 0 end,
      'source', coalesce(candidate.source, 'none'),
      'notes', candidate.notes,
      'updatedAt', candidate.updated_at,
      'revision', coalesce(candidate.revision, 0),
      'accessAllowed', candidate.access_allowed
    ) order by candidate.updated_at desc nulls last, candidate.account_id), '[]'::jsonb),
    'total', coalesce(max(candidate.total_count), 0),
    'pageSize', safe_size,
    'pageOffset', safe_offset,
    'serverNow', now()
  ) into response_payload
  from candidates as candidate;

  return response_payload;
end;
$$;

create or replace function public.admin_manage_premium_entitlement(
  target_user_id uuid,
  requested_action text,
  duration_days integer default null,
  requested_expires_at timestamptz default null,
  requested_plan text default 'premium',
  requested_source text default 'admin',
  requested_note text default null,
  request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  server_now timestamptz := now();
  normalized_action text := upper(trim(coalesce($2, '')));
  normalized_plan text := left(trim(coalesce(nullif($5, ''), 'premium')), 80);
  normalized_source text := left(trim(coalesce(nullif($6, ''), 'admin')), 120);
  normalized_note text := nullif(left(trim(coalesce($7, '')), 2000), '');
  old_entitlement public.premium_entitlements%rowtype;
  old_status text := 'free';
  old_expiry timestamptz;
  next_status text;
  next_starts_at timestamptz;
  next_expiry timestamptz;
  renewal_base timestamptz;
  entitlement_active boolean := false;
  duplicate_request boolean := false;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users where id = $1) then raise exception 'target_user_not_found'; end if;
  if $8 is null then raise exception 'request_id_required'; end if;
  if normalized_action not in ('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'CANCEL_PREMIUM', 'MARK_COMPLIMENTARY') then
    raise exception 'invalid_premium_action';
  end if;
  if char_length(normalized_plan) = 0 or char_length(normalized_source) = 0 then raise exception 'invalid_premium_metadata'; end if;
  if $3 is not null and ($3 < 1 or $3 > 3650) then raise exception 'invalid_duration_days'; end if;

  perform pg_advisory_xact_lock(hashtextextended($1::text, 0));

  if exists (
    select 1 from public.premium_admin_audit_log as audit
    where audit.admin_user_id = caller_id and audit.request_id = $8
  ) then
    duplicate_request := true;
    return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select * into old_entitlement
  from public.premium_entitlements as entitlement
  where entitlement.account_id = $1
  for update;

  if found then
    old_status := old_entitlement.status;
    old_expiry := old_entitlement.expires_at;
    entitlement_active := old_entitlement.status in ('active', 'trial', 'complimentary')
      and old_entitlement.expires_at > server_now;
  end if;

  renewal_base := case when entitlement_active then old_expiry else server_now end;
  next_starts_at := case when entitlement_active then old_entitlement.starts_at else server_now end;

  case normalized_action
    when 'ACTIVATE_PREMIUM' then
      next_status := 'active';
      next_expiry := renewal_base + make_interval(days => coalesce($3, 30));
    when 'EXTEND_PREMIUM' then
      if $3 is null then raise exception 'duration_days_required'; end if;
      next_status := case when old_status = 'complimentary' then 'complimentary' else 'active' end;
      next_expiry := renewal_base + make_interval(days => $3);
    when 'SET_EXPIRY' then
      if $4 is null or $4 <= server_now then raise exception 'future_expiry_required'; end if;
      next_status := case when old_status in ('trial', 'complimentary') then old_status else 'active' end;
      next_expiry := $4;
    when 'CANCEL_PREMIUM' then
      next_status := 'cancelled';
      next_starts_at := coalesce(old_entitlement.starts_at, server_now);
      next_expiry := coalesce(old_expiry, server_now);
    when 'MARK_COMPLIMENTARY' then
      next_status := 'complimentary';
      next_expiry := renewal_base + make_interval(days => coalesce($3, 365));
  end case;

  insert into public.premium_entitlements (
    account_id, plan, status, starts_at, expires_at, source, notes, updated_by
  ) values (
    $1, normalized_plan, next_status, next_starts_at, next_expiry,
    normalized_source, normalized_note, caller_id
  )
  on conflict (account_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    starts_at = excluded.starts_at,
    expires_at = excluded.expires_at,
    source = excluded.source,
    notes = excluded.notes,
    updated_by = excluded.updated_by;

  -- Compatibility mirror only. New clients and Edge Functions read the
  -- canonical entitlement RPC, never these legacy columns.
  insert into public.profiles (id, display_name, access_status, access_expires_at)
  values (
    $1,
    coalesce((select split_part(coalesce(email, ''), '@', 1) from auth.users where id = $1), 'Murid'),
    case when next_status in ('active', 'trial', 'complimentary') and next_expiry > server_now then 'premium' else 'expired' end,
    next_expiry
  )
  on conflict (id) do update set
    access_status = excluded.access_status,
    access_expires_at = excluded.access_expires_at;

  insert into public.premium_admin_audit_log (
    request_id, admin_user_id, target_user_id, action,
    old_status, new_status, old_expiry, new_expiry, reason
  ) values (
    $8, caller_id, $1, normalized_action,
    old_status, next_status, old_expiry, next_expiry, normalized_note
  );

  return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', duplicate_request);
end;
$$;

alter table public.premium_entitlements enable row level security;
alter table public.premium_admin_audit_log enable row level security;

drop policy if exists "Users can read own premium entitlement" on public.premium_entitlements;
create policy "Users can read own premium entitlement" on public.premium_entitlements
  for select to authenticated using (auth.uid() = account_id);

drop policy if exists "Admins can read premium entitlements" on public.premium_entitlements;
create policy "Admins can read premium entitlements" on public.premium_entitlements
  for select to authenticated using (public.is_current_premium_admin());

drop policy if exists "Admins can read premium audit log" on public.premium_admin_audit_log;
create policy "Admins can read premium audit log" on public.premium_admin_audit_log
  for select to authenticated using (public.is_current_premium_admin());

revoke all on table public.premium_entitlements from public, anon, authenticated;
revoke all on table public.premium_admin_audit_log from public, anon, authenticated;
grant select on table public.premium_entitlements to authenticated;
grant select on table public.premium_admin_audit_log to authenticated;
grant select, insert, update, delete on table public.premium_entitlements to postgres, service_role;
grant select, insert on table public.premium_admin_audit_log to postgres, service_role;
grant usage, select on sequence public.premium_admin_audit_log_id_seq to postgres, service_role;

revoke all on function public.touch_premium_entitlement_updated_at() from public, anon, authenticated;
revoke all on function public.is_current_premium_admin() from public, anon, authenticated;
revoke all on function public.premium_entitlement_payload(uuid) from public, anon, authenticated;
revoke all on function public.get_my_premium_entitlement() from public, anon, authenticated;
revoke all on function public.admin_premium_summary() from public, anon, authenticated;
revoke all on function public.admin_search_premium_accounts(text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_manage_premium_entitlement(uuid, text, integer, timestamptz, text, text, text, uuid) from public, anon, authenticated;

grant execute on function public.is_current_premium_admin() to authenticated;
grant execute on function public.get_my_premium_entitlement() to authenticated;
grant execute on function public.admin_premium_summary() to authenticated;
grant execute on function public.admin_search_premium_accounts(text, integer, integer) to authenticated;
grant execute on function public.admin_manage_premium_entitlement(uuid, text, integer, timestamptz, text, text, text, uuid) to authenticated;

grant execute on function public.touch_premium_entitlement_updated_at() to postgres, service_role;
grant execute on function public.is_current_premium_admin() to postgres, service_role;
grant execute on function public.premium_entitlement_payload(uuid) to postgres, service_role;
grant execute on function public.get_my_premium_entitlement() to postgres, service_role;
grant execute on function public.admin_premium_summary() to postgres, service_role;
grant execute on function public.admin_search_premium_accounts(text, integer, integer) to postgres, service_role;
grant execute on function public.admin_manage_premium_entitlement(uuid, text, integer, timestamptz, text, text, text, uuid) to postgres, service_role;

commit;
