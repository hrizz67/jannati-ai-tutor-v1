create or replace function public.touch_premium_entitlement_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  return new;
end;
$$;

create or replace function public.is_current_premium_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.premium_entitlement_payload(target_account_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_build_object(
      'accountId', e.account_id, 'plan', e.plan, 'storedStatus', e.status,
      'effectiveStatus', case
        when e.status in ('active', 'trial', 'complimentary') and e.expires_at > now() then e.status
        when e.status = 'cancelled' then 'cancelled' else 'expired' end,
      'startsAt', e.starts_at, 'expiresAt', e.expires_at, 'source', e.source,
      'notes', e.notes, 'updatedAt', e.updated_at, 'updatedBy', e.updated_by,
      'revision', e.revision,
      'accessAllowed', e.status in ('active', 'trial', 'complimentary') and e.expires_at > now(),
      'serverNow', now()
    ) from public.premium_entitlements e where e.account_id = target_account_id
  ), jsonb_build_object(
    'accountId', target_account_id, 'plan', 'free', 'storedStatus', 'free',
    'effectiveStatus', 'free', 'startsAt', null, 'expiresAt', null,
    'source', 'none', 'notes', null, 'updatedAt', null, 'updatedBy', null,
    'revision', 0, 'accessAllowed', false, 'serverNow', now()
  ));
$$;

create or replace function public.get_my_premium_entitlement()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  return public.premium_entitlement_payload(caller_id);
end;
$$;

create or replace function public.admin_premium_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  return (select jsonb_build_object(
    'activePremium', count(*) filter (where e.status in ('active', 'trial') and e.expires_at > now()),
    'expiringIn7Days', count(*) filter (where e.status in ('active', 'trial', 'complimentary') and e.expires_at > now() and e.expires_at <= now() + interval '7 days'),
    'expired', count(*) filter (where e.status in ('expired', 'cancelled') or (e.status in ('active', 'trial', 'complimentary') and e.expires_at <= now())),
    'complimentary', count(*) filter (where e.status = 'complimentary' and e.expires_at > now()),
    'serverNow', now()
  ) from public.premium_entitlements e);
end;
$$;

create or replace function public.admin_search_premium_accounts(search_text text, page_size integer default 20, page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
    select u.id account_id, u.email,
      coalesce(nullif(trim(p.display_name), ''), nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(u.email, ''), '@', 1), 'Akaun') display_name,
      e.plan, e.status stored_status, e.starts_at, e.expires_at, e.source, e.notes, e.updated_at, e.revision,
      e.status in ('active', 'trial', 'complimentary') and e.expires_at > now() access_allowed,
      case when e.account_id is null then 'free'
        when e.status in ('active', 'trial', 'complimentary') and e.expires_at > now() then e.status
        when e.status = 'cancelled' then 'cancelled' else 'expired' end effective_status,
      count(*) over() total_count
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.premium_entitlements e on e.account_id = u.id
    where position(normalized_search in lower(coalesce(u.email, ''))) > 0
       or position(normalized_search in lower(coalesce(p.display_name, ''))) > 0
       or position(normalized_search in lower(u.id::text)) > 0
    order by coalesce(e.updated_at, u.updated_at, u.created_at) desc, u.id
    limit safe_size offset safe_offset
  )
  select jsonb_build_object(
    'accounts', coalesce(jsonb_agg(jsonb_build_object(
      'accountId', c.account_id, 'email', c.email, 'displayName', c.display_name,
      'plan', coalesce(c.plan, 'free'), 'storedStatus', coalesce(c.stored_status, 'free'),
      'effectiveStatus', c.effective_status, 'startsAt', c.starts_at, 'expiresAt', c.expires_at,
      'daysRemaining', case when c.access_allowed then greatest(0, ceil(extract(epoch from (c.expires_at - now())) / 86400.0)::integer) else 0 end,
      'source', coalesce(c.source, 'none'), 'notes', c.notes, 'updatedAt', c.updated_at,
      'revision', coalesce(c.revision, 0), 'accessAllowed', c.access_allowed
    ) order by c.updated_at desc nulls last, c.account_id), '[]'::jsonb),
    'total', coalesce(max(c.total_count), 0), 'pageSize', safe_size,
    'pageOffset', safe_offset, 'serverNow', now()
  ) into response_payload from candidates c;
  return response_payload;
end;
$$;

create or replace function public.admin_manage_premium_entitlement(
  target_user_id uuid, requested_action text, duration_days integer default null,
  requested_expires_at timestamptz default null, requested_plan text default 'premium',
  requested_source text default 'admin', requested_note text default null,
  request_id uuid default gen_random_uuid()
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  server_now timestamptz := now();
  normalized_action text := upper(trim(coalesce($2, '')));
  normalized_plan text := left(trim(coalesce(nullif($5, ''), 'premium')), 80);
  normalized_source text := left(trim(coalesce(nullif($6, ''), 'admin')), 120);
  normalized_note text := nullif(left(trim(coalesce($7, '')), 2000), '');
  old_entitlement public.premium_entitlements%rowtype;
  old_status text := 'free'; old_expiry timestamptz; next_status text;
  next_starts_at timestamptz; next_expiry timestamptz; renewal_base timestamptz;
  entitlement_active boolean := false;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users where id = $1) then raise exception 'target_user_not_found'; end if;
  if $8 is null then raise exception 'request_id_required'; end if;
  if normalized_action not in ('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'CANCEL_PREMIUM', 'MARK_COMPLIMENTARY') then raise exception 'invalid_premium_action'; end if;
  if char_length(normalized_plan) = 0 or char_length(normalized_source) = 0 then raise exception 'invalid_premium_metadata'; end if;
  if $3 is not null and ($3 < 1 or $3 > 3650) then raise exception 'invalid_duration_days'; end if;

  perform pg_advisory_xact_lock(hashtextextended($1::text, 0));
  if exists (select 1 from public.premium_admin_audit_log a where a.admin_user_id = caller_id and a.request_id = $8) then
    return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select * into old_entitlement from public.premium_entitlements e where e.account_id = $1 for update;
  if found then
    old_status := old_entitlement.status; old_expiry := old_entitlement.expires_at;
    entitlement_active := old_entitlement.status in ('active', 'trial', 'complimentary') and old_entitlement.expires_at > server_now;
  end if;
  renewal_base := case when entitlement_active then old_expiry else server_now end;
  next_starts_at := case when entitlement_active then old_entitlement.starts_at else server_now end;

  case normalized_action
    when 'ACTIVATE_PREMIUM' then next_status := 'active'; next_expiry := renewal_base + make_interval(days => coalesce($3, 30));
    when 'EXTEND_PREMIUM' then
      if $3 is null then raise exception 'duration_days_required'; end if;
      next_status := case when old_status = 'complimentary' then 'complimentary' else 'active' end;
      next_expiry := renewal_base + make_interval(days => $3);
    when 'SET_EXPIRY' then
      if $4 is null or $4 <= server_now then raise exception 'future_expiry_required'; end if;
      next_status := case when old_status in ('trial', 'complimentary') then old_status else 'active' end; next_expiry := $4;
    when 'CANCEL_PREMIUM' then
      next_status := 'cancelled'; next_starts_at := coalesce(old_entitlement.starts_at, server_now); next_expiry := coalesce(old_expiry, server_now);
    when 'MARK_COMPLIMENTARY' then next_status := 'complimentary'; next_expiry := renewal_base + make_interval(days => coalesce($3, 365));
  end case;

  insert into public.premium_entitlements (account_id, plan, status, starts_at, expires_at, source, notes, updated_by)
  values ($1, normalized_plan, next_status, next_starts_at, next_expiry, normalized_source, normalized_note, caller_id)
  on conflict (account_id) do update set plan = excluded.plan, status = excluded.status,
    starts_at = excluded.starts_at, expires_at = excluded.expires_at, source = excluded.source,
    notes = excluded.notes, updated_by = excluded.updated_by;

  insert into public.profiles (id, display_name, access_status, access_expires_at)
  values ($1, coalesce((select split_part(coalesce(email, ''), '@', 1) from auth.users where id = $1), 'Murid'),
    case when next_status in ('active', 'trial', 'complimentary') and next_expiry > server_now then 'premium' else 'expired' end, next_expiry)
  on conflict (id) do update set access_status = excluded.access_status, access_expires_at = excluded.access_expires_at;

  insert into public.premium_admin_audit_log (request_id, admin_user_id, target_user_id, action, old_status, new_status, old_expiry, new_expiry, reason)
  values ($8, caller_id, $1, normalized_action, old_status, next_status, old_expiry, next_expiry, normalized_note);
  return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', false);
end;
$$;

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
