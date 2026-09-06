create or replace function public.admin_console_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur';
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  return jsonb_build_object(
    'totalAccounts', (select count(*) from auth.users),
    'activePremium', (select count(*) from public.premium_entitlements e where e.status = 'active' and e.expires_at > now()),
    'expiringIn7Days', (select count(*) from public.premium_entitlements e where e.status in ('active', 'trial', 'complimentary') and not e.is_permanent and e.expires_at > now() and e.expires_at <= now() + interval '7 days'),
    'expiringIn30Days', (select count(*) from public.premium_entitlements e where e.status in ('active', 'trial', 'complimentary') and not e.is_permanent and e.expires_at > now() and e.expires_at <= now() + interval '30 days'),
    'expired', (select count(*) from public.premium_entitlements e where e.status = 'expired' or (e.status in ('active', 'trial', 'complimentary') and not e.is_permanent and e.expires_at <= now())),
    'trialAccounts', (select count(*) from public.premium_entitlements e where e.status = 'trial' and e.expires_at > now()),
    'complimentaryAccounts', (select count(*) from public.premium_entitlements e where e.status = 'complimentary' and (e.is_permanent or e.expires_at > now())),
    'newAccountsThisMonth', (select count(*) from auth.users u where u.created_at >= month_start),
    'renewalsThisMonth', (select count(*) from public.premium_payment_records p where p.created_at >= month_start and p.action in ('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY')),
    'serverNow', now()
  );
end;
$$;

create or replace function public.admin_search_customers(search_text text default '', status_filter text default 'all', page_size integer default 20, page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  normalized_search text := lower(trim(coalesce($1, '')));
  normalized_filter text := lower(trim(coalesce(nullif($2, ''), 'all')));
  safe_size integer := least(greatest(coalesce($3, 20), 1), 50);
  safe_offset integer := greatest(coalesce($4, 0), 0);
  response_payload jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if normalized_filter not in ('all', 'active', 'expiring_7', 'expiring_30', 'expired', 'trial', 'complimentary') then raise exception 'invalid_status_filter'; end if;
  with base as (
    select u.id account_id, u.email,
      coalesce(nullif(trim(p.display_name), ''), nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(u.email, ''), '@', 1), 'Akaun') display_name,
      u.created_at, e.plan, e.status stored_status, e.starts_at, e.expires_at,
      coalesce(e.is_permanent, false) is_permanent, e.source, e.notes, e.updated_at,
      coalesce(e.revision, 0) revision,
      case when e.account_id is null then 'free'
        when e.status in ('active', 'trial', 'complimentary') and (e.is_permanent or e.expires_at > now()) then e.status
        when e.status = 'cancelled' then 'cancelled' else 'expired' end effective_status,
      e.status in ('active', 'trial', 'complimentary') and (e.is_permanent or e.expires_at > now()) access_allowed,
      case when e.is_permanent then null when e.expires_at > now() then greatest(0, ceil(extract(epoch from (e.expires_at - now())) / 86400.0)::integer) else 0 end days_remaining,
      coalesce((select count(*) from public.learner_profiles lp where lp.account_id = u.id and lp.archived_at is null), 0) child_count,
      coalesce((select jsonb_agg(jsonb_build_object('id', lp.id, 'name', lp.display_name, 'year', lp.school_year) order by lp.created_at) from public.learner_profiles lp where lp.account_id = u.id and lp.archived_at is null), '[]'::jsonb) children,
      last_payment.payment_reference last_payment_reference, last_payment.payment_status last_payment_status,
      last_payment.notes last_payment_note, last_payment.created_at last_renewal_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.premium_entitlements e on e.account_id = u.id
    left join lateral (select pr.payment_reference, pr.payment_status, pr.notes, pr.created_at from public.premium_payment_records pr where pr.account_id = u.id order by pr.created_at desc limit 1) last_payment on true
    where normalized_search = ''
      or position(normalized_search in lower(coalesce(u.email, ''))) > 0
      or position(normalized_search in lower(coalesce(p.display_name, ''))) > 0
      or position(normalized_search in lower(u.id::text)) > 0
      or exists (select 1 from public.learner_profiles lp where lp.account_id = u.id and lp.archived_at is null and position(normalized_search in lower(lp.display_name)) > 0)
  ), filtered as (
    select base.*, count(*) over() total_count from base
    where normalized_filter = 'all'
      or (normalized_filter = 'active' and base.effective_status = 'active')
      or (normalized_filter = 'expiring_7' and base.access_allowed and not base.is_permanent and base.expires_at <= now() + interval '7 days')
      or (normalized_filter = 'expiring_30' and base.access_allowed and not base.is_permanent and base.expires_at <= now() + interval '30 days')
      or (normalized_filter = 'expired' and base.effective_status = 'expired')
      or (normalized_filter = 'trial' and base.effective_status = 'trial')
      or (normalized_filter = 'complimentary' and base.effective_status = 'complimentary')
    order by coalesce(base.updated_at, base.created_at) desc, base.account_id limit safe_size offset safe_offset
  )
  select jsonb_build_object(
    'accounts', coalesce(jsonb_agg(jsonb_build_object(
      'accountId', f.account_id, 'email', f.email, 'displayName', f.display_name, 'createdAt', f.created_at,
      'childCount', f.child_count, 'children', f.children, 'plan', coalesce(f.plan, 'free'),
      'storedStatus', coalesce(f.stored_status, 'free'), 'effectiveStatus', f.effective_status,
      'startsAt', f.starts_at, 'expiresAt', f.expires_at, 'isPermanent', f.is_permanent,
      'daysRemaining', f.days_remaining, 'source', coalesce(f.source, 'none'), 'notes', f.notes,
      'updatedAt', f.updated_at, 'revision', f.revision, 'accessAllowed', f.access_allowed,
      'lastPaymentReference', f.last_payment_reference, 'lastPaymentStatus', f.last_payment_status,
      'lastPaymentNote', f.last_payment_note, 'lastRenewalAt', f.last_renewal_at
    ) order by coalesce(f.updated_at, f.created_at) desc, f.account_id), '[]'::jsonb),
    'total', coalesce(max(f.total_count), 0), 'pageSize', safe_size, 'pageOffset', safe_offset,
    'filter', normalized_filter, 'serverNow', now()
  ) into response_payload from filtered f;
  return response_payload;
end;
$$;

create or replace function public.admin_get_customer_details(target_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare response_payload jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users u where u.id = $1) then raise exception 'target_user_not_found'; end if;
  select jsonb_build_object(
    'overview', jsonb_build_object('accountId', u.id, 'email', u.email,
      'displayName', coalesce(nullif(trim(p.display_name), ''), nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(u.email, ''), '@', 1), 'Akaun'),
      'createdAt', u.created_at, 'lastSignInAt', u.last_sign_in_at,
      'childCount', (select count(*) from public.learner_profiles lp where lp.account_id = u.id and lp.archived_at is null)),
    'subscription', public.premium_entitlement_payload(u.id),
    'children', coalesce((select jsonb_agg(jsonb_build_object('id', lp.id, 'name', lp.display_name, 'year', lp.school_year, 'avatar', lp.avatar, 'createdAt', lp.created_at, 'updatedAt', lp.updated_at) order by lp.created_at) from public.learner_profiles lp where lp.account_id = u.id and lp.archived_at is null), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(to_jsonb(payment_row) order by payment_row."createdAt" desc) from (
      select pr.id, pr.action, pr.amount, pr.currency, pr.payment_method "paymentMethod", pr.payment_reference "paymentReference",
        pr.payment_status "paymentStatus", pr.paid_at "paidAt", pr.subscription_days_added "subscriptionDaysAdded",
        pr.previous_expiry "previousExpiry", pr.new_expiry "newExpiry", pr.notes, pr.recorded_by "recordedBy", pr.created_at "createdAt"
      from public.premium_payment_records pr where pr.account_id = u.id order by pr.created_at desc limit 50
    ) payment_row), '[]'::jsonb),
    'auditHistory', coalesce((select jsonb_agg(to_jsonb(audit_row) order by audit_row."createdAt" desc) from (
      select a.id, a.action, a.old_status "oldStatus", a.new_status "newStatus", a.old_expiry "oldExpiry",
        a.new_expiry "newExpiry", a.reason, a.before_state "beforeState", a.after_state "afterState",
        a.admin_user_id "adminUserId", a.created_at "createdAt"
      from public.premium_admin_audit_log a where a.target_user_id = u.id order by a.created_at desc limit 100
    ) audit_row), '[]'::jsonb), 'serverNow', now()
  ) into response_payload from auth.users u left join public.profiles p on p.id = u.id where u.id = $1;
  return response_payload;
end;
$$;

create or replace function public.admin_apply_subscription_change(
  target_user_id uuid, requested_action text, duration_days integer default null,
  requested_expires_at timestamptz default null, requested_plan text default 'premium',
  requested_source text default 'admin-console-v2', requested_note text default null,
  request_id uuid default gen_random_uuid(), permanent_complimentary boolean default false,
  payment_amount numeric default null, payment_currency text default 'MYR',
  payment_method text default 'manual', payment_reference text default null,
  payment_status text default 'paid', payment_paid_at timestamptz default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid(); server_now timestamptz := now();
  normalized_action text := upper(trim(coalesce($2, '')));
  normalized_plan text := left(trim(coalesce(nullif($5, ''), 'premium')), 80);
  normalized_source text := left(trim(coalesce(nullif($6, ''), 'admin-console-v2')), 120);
  normalized_note text := nullif(left(trim(coalesce($7, '')), 2000), '');
  normalized_currency text := upper(left(trim(coalesce(nullif($11, ''), 'MYR')), 3));
  normalized_method text := lower(trim(coalesce(nullif($12, ''), 'manual')));
  normalized_reference text := nullif(left(trim(coalesce($13, '')), 200), '');
  normalized_payment_status text := lower(trim(coalesce(nullif($14, ''), 'paid')));
  old_entitlement public.premium_entitlements%rowtype;
  old_status text := 'free'; old_plan text := 'free'; old_expiry timestamptz; old_permanent boolean := false;
  entitlement_active boolean := false; next_status text; next_plan text; next_starts_at timestamptz;
  next_expiry timestamptz; next_permanent boolean := false; renewal_base timestamptz;
  days_added integer := 0; should_record_payment boolean := false;
  old_state jsonb; next_state jsonb; payment_payload jsonb := null;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users u where u.id = $1) then raise exception 'target_user_not_found'; end if;
  if $8 is null then raise exception 'request_id_required'; end if;
  if normalized_action not in ('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'START_TRIAL', 'MARK_COMPLIMENTARY', 'CANCEL_PREMIUM', 'EXPIRE_PREMIUM') then raise exception 'invalid_premium_action'; end if;
  if $3 is not null and ($3 < 1 or $3 > 3650) then raise exception 'invalid_duration_days'; end if;
  if normalized_method not in ('bank_transfer', 'duitnow', 'cash', 'manual', 'promotion', 'complimentary', 'other') then raise exception 'invalid_payment_method'; end if;
  if normalized_payment_status not in ('paid', 'pending', 'waived', 'failed', 'refunded') then raise exception 'invalid_payment_status'; end if;
  if coalesce($10, 0) < 0 then raise exception 'invalid_payment_amount'; end if;
  if normalized_payment_status = 'paid' and normalized_reference is null then raise exception 'payment_reference_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended($1::text, 0));
  if exists (select 1 from public.premium_admin_audit_log a where a.admin_user_id = caller_id and a.request_id = $8) then
    return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', true);
  end if;
  select * into old_entitlement from public.premium_entitlements e where e.account_id = $1 for update;
  if found then
    old_status := old_entitlement.status; old_plan := old_entitlement.plan; old_expiry := old_entitlement.expires_at;
    old_permanent := old_entitlement.is_permanent;
    entitlement_active := old_entitlement.status in ('active', 'trial', 'complimentary') and (old_entitlement.is_permanent or old_entitlement.expires_at > server_now);
  end if;
  old_state := jsonb_build_object('plan', old_plan, 'status', old_status, 'expiresAt', old_expiry, 'isPermanent', old_permanent);
  renewal_base := case when entitlement_active and old_expiry is not null then old_expiry else server_now end;
  next_starts_at := case when entitlement_active then old_entitlement.starts_at else server_now end;
  next_plan := normalized_plan;
  case normalized_action
    when 'ACTIVATE_PREMIUM' then next_status := 'active'; next_expiry := (case when old_permanent then server_now else renewal_base end) + make_interval(days => coalesce($3, 30)); days_added := coalesce($3, 30); should_record_payment := true;
    when 'EXTEND_PREMIUM' then
      if $3 is null then raise exception 'duration_days_required'; end if;
      if old_permanent then raise exception 'permanent_complimentary_requires_expiry_change'; end if;
      next_status := 'active'; next_expiry := renewal_base + make_interval(days => $3); days_added := $3; should_record_payment := true;
    when 'SET_EXPIRY' then
      if $4 is null or $4 <= server_now then raise exception 'future_expiry_required'; end if;
      next_status := case when old_status in ('trial', 'complimentary') then old_status else 'active' end;
      next_plan := case when next_status = 'trial' then 'premium_trial' when next_status = 'complimentary' then 'premium_complimentary' else normalized_plan end;
      next_expiry := $4; days_added := greatest(0, ceil(extract(epoch from ($4 - coalesce(old_expiry, server_now))) / 86400.0)::integer); should_record_payment := true;
    when 'START_TRIAL' then
      if entitlement_active then raise exception 'active_entitlement_cannot_start_trial'; end if;
      if $4 is null and $3 is null then raise exception 'trial_duration_required'; end if;
      next_status := 'trial'; next_plan := 'premium_trial'; next_starts_at := server_now; next_expiry := coalesce($4, server_now + make_interval(days => $3));
      if next_expiry <= server_now then raise exception 'future_expiry_required'; end if;
      days_added := coalesce($3, greatest(1, ceil(extract(epoch from (next_expiry - server_now)) / 86400.0)::integer)); should_record_payment := true; normalized_method := 'promotion'; normalized_payment_status := 'waived';
    when 'MARK_COMPLIMENTARY' then
      next_status := 'complimentary'; next_plan := 'premium_complimentary'; next_permanent := coalesce($9, false);
      if next_permanent then next_expiry := null; days_added := 0;
      else next_expiry := coalesce($4, renewal_base + make_interval(days => coalesce($3, 30)));
        if next_expiry <= server_now then raise exception 'future_expiry_required'; end if;
        days_added := coalesce($3, greatest(1, ceil(extract(epoch from (next_expiry - renewal_base)) / 86400.0)::integer));
      end if;
      should_record_payment := true; normalized_method := 'complimentary'; normalized_payment_status := 'waived';
    when 'CANCEL_PREMIUM' then next_status := 'cancelled'; next_plan := old_plan; next_starts_at := coalesce(old_entitlement.starts_at, server_now); next_expiry := coalesce(old_expiry, server_now);
    when 'EXPIRE_PREMIUM' then next_status := 'expired'; next_plan := old_plan; next_starts_at := coalesce(old_entitlement.starts_at, server_now); next_expiry := server_now;
  end case;
  next_state := jsonb_build_object('plan', next_plan, 'status', next_status, 'expiresAt', next_expiry, 'isPermanent', next_permanent);
  insert into public.premium_entitlements(account_id, plan, status, starts_at, expires_at, is_permanent, source, notes, updated_by)
    values($1, next_plan, next_status, next_starts_at, next_expiry, next_permanent, normalized_source, normalized_note, caller_id)
    on conflict(account_id) do update set plan = excluded.plan, status = excluded.status, starts_at = excluded.starts_at,
      expires_at = excluded.expires_at, is_permanent = excluded.is_permanent, source = excluded.source, notes = excluded.notes, updated_by = excluded.updated_by;
  insert into public.profiles(id, display_name, access_status, access_expires_at)
    values($1, coalesce((select split_part(coalesce(u.email, ''), '@', 1) from auth.users u where u.id = $1), 'Murid'),
      case when next_status in ('active', 'trial', 'complimentary') and (next_permanent or next_expiry > server_now) then 'premium' else 'expired' end, next_expiry)
    on conflict(id) do update set access_status = excluded.access_status, access_expires_at = excluded.access_expires_at;
  if should_record_payment then
    insert into public.premium_payment_records(request_id, account_id, action, amount, currency, payment_method, payment_reference, payment_status, paid_at, subscription_days_added, previous_expiry, new_expiry, notes, recorded_by)
      values($8, $1, normalized_action, coalesce($10, 0), normalized_currency, normalized_method, normalized_reference,
        normalized_payment_status, case when normalized_payment_status = 'paid' then coalesce($15, server_now) else $15 end,
        days_added, old_expiry, next_expiry, normalized_note, caller_id)
      returning jsonb_build_object('id', id, 'amount', amount, 'currency', currency, 'paymentMethod', payment_method,
        'paymentReference', payment_reference, 'paymentStatus', payment_status, 'createdAt', created_at) into payment_payload;
  end if;
  insert into public.premium_admin_audit_log(request_id, admin_user_id, target_user_id, action, old_status, new_status, old_expiry, new_expiry, reason, before_state, after_state)
    values($8, caller_id, $1, normalized_action, old_status, next_status, old_expiry, next_expiry, normalized_note, old_state, next_state);
  return public.premium_entitlement_payload($1) || jsonb_build_object('ok', true, 'duplicate', false, 'payment', payment_payload);
end;
$$;

revoke all on function public.admin_console_summary() from public, anon, authenticated;
revoke all on function public.admin_manage_premium_entitlement(uuid, text, integer, timestamptz, text, text, text, uuid) from authenticated;
revoke all on function public.admin_search_customers(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_get_customer_details(uuid) from public, anon, authenticated;
revoke all on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_console_summary() to authenticated, postgres, service_role;
grant execute on function public.admin_search_customers(text, text, integer, integer) to authenticated, postgres, service_role;
grant execute on function public.admin_get_customer_details(uuid) to authenticated, postgres, service_role;
grant execute on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) to authenticated, postgres, service_role;
