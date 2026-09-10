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

create or replace function public.admin_child_summary_payload(target_account_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  account_learning_data jsonb := '{}'::jsonb;
  encoded_child_state jsonb;
  canonical_child_state jsonb;
  canonical_shape_valid boolean := false;
  raw_active_child_id text := '';
  resolved_active_child_id text := '';
  children_payload jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users as account_user where account_user.id = $1) then raise exception 'target_user_not_found'; end if;

  select coalesce(account_profile.learning_data, '{}'::jsonb) into account_learning_data
  from public.profiles as account_profile where account_profile.id = $1;
  encoded_child_state := account_learning_data -> 'jannati_cloud_child_state';
  if encoded_child_state is not null then
    begin
      canonical_child_state := case jsonb_typeof(encoded_child_state)
        when 'object' then encoded_child_state
        when 'string' then (encoded_child_state #>> '{}')::jsonb
        else null
      end;
    exception when others then canonical_child_state := null;
    end;
  end if;
  canonical_shape_valid := jsonb_typeof(canonical_child_state) = 'object' and jsonb_typeof(canonical_child_state -> 'profiles') = 'array';

  if canonical_shape_valid then
    raw_active_child_id := trim(coalesce(canonical_child_state ->> 'activeChildId', ''));
    with profile_candidates as (
      select profile_entry.profile_ordinal,
        trim(profile_entry.profile_value ->> 'id') child_id,
        trim(profile_entry.profile_value ->> 'name') child_name,
        trim(coalesce(profile_entry.profile_value ->> 'year', '')) child_year,
        trim(coalesce(profile_entry.profile_value ->> 'avatar', '')) child_avatar
      from jsonb_array_elements(canonical_child_state -> 'profiles') with ordinality as profile_entry(profile_value, profile_ordinal)
      where jsonb_typeof(profile_entry.profile_value) = 'object'
    ), effective_profiles as (
      select candidate.* from profile_candidates candidate
      where candidate.child_id <> '' and candidate.child_name <> '' and char_length(candidate.child_id) <= 512
        and not (jsonb_typeof(canonical_child_state -> 'deletedChildren') = 'object' and (canonical_child_state -> 'deletedChildren') ? candidate.child_id)
        and not (exists (
          select 1 from jsonb_array_elements_text(case
            when jsonb_typeof(canonical_child_state -> 'deletedChildren') = 'array' then canonical_child_state -> 'deletedChildren'
            else '[]'::jsonb end) deleted_entry(child_id)
          where deleted_entry.child_id = candidate.child_id
        ))
        and not (jsonb_typeof(canonical_child_state -> 'archivedChildren') = 'object'
          and jsonb_typeof((canonical_child_state -> 'archivedChildren') -> candidate.child_id) = 'object'
          and case when coalesce((canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'archivedAt'), '') ~ '^[0-9]+([.][0-9]+)?$'
            then (canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'archivedAt')::numeric else 0 end
          > case when coalesce((canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'restoredAt'), '') ~ '^[0-9]+([.][0-9]+)?$'
            then (canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'restoredAt')::numeric else 0 end)
    ), distinct_profiles as (
      select distinct on (effective.child_id) effective.* from effective_profiles effective
      order by effective.child_id, effective.profile_ordinal
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', distinct_profile.child_id, 'name', left(distinct_profile.child_name, 200),
      'year', left(distinct_profile.child_year, 80), 'avatar', left(distinct_profile.child_avatar, 256),
      'isActive', distinct_profile.child_id = raw_active_child_id
    ) order by distinct_profile.profile_ordinal), '[]'::jsonb) into children_payload
    from distinct_profiles distinct_profile;
    select coalesce((select child_entry ->> 'id' from jsonb_array_elements(children_payload) child_entry
      where child_entry ->> 'id' = raw_active_child_id limit 1), '') into resolved_active_child_id;
    return jsonb_build_object('childCount', jsonb_array_length(children_payload), 'activeChildId', resolved_active_child_id,
      'children', children_payload, 'source', 'learning_data');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', coalesce(nullif(trim(legacy_profile.legacy_child_id), ''), legacy_profile.id::text),
    'name', left(trim(legacy_profile.display_name), 200), 'year', left(trim(coalesce(legacy_profile.school_year, '')), 80),
    'avatar', left(trim(coalesce(legacy_profile.avatar, '')), 256), 'isActive', false
  ) order by legacy_profile.created_at, legacy_profile.id), '[]'::jsonb) into children_payload
  from public.learner_profiles legacy_profile
  where legacy_profile.account_id = $1 and legacy_profile.archived_at is null and trim(coalesce(legacy_profile.display_name, '')) <> '';
  return jsonb_build_object('childCount', jsonb_array_length(children_payload), 'activeChildId', '',
    'children', children_payload, 'source', 'learner_profiles');
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
      coalesce((child_summary.payload ->> 'childCount')::integer, 0) child_count,
      coalesce(child_summary.payload -> 'children', '[]'::jsonb) children,
      coalesce(child_summary.payload ->> 'activeChildId', '') active_child_id,
      coalesce(child_summary.payload ->> 'source', 'learner_profiles') child_source,
      last_payment.payment_reference last_payment_reference, last_payment.payment_status last_payment_status,
      last_payment.notes last_payment_note, last_payment.created_at last_renewal_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.premium_entitlements e on e.account_id = u.id
    cross join lateral (select public.admin_child_summary_payload(u.id) payload) child_summary
    left join lateral (select pr.payment_reference, pr.payment_status, pr.notes, pr.created_at from public.premium_payment_records pr where pr.account_id = u.id order by pr.created_at desc limit 1) last_payment on true
    where normalized_search = ''
      or position(normalized_search in lower(coalesce(u.email, ''))) > 0
      or position(normalized_search in lower(coalesce(p.display_name, ''))) > 0
      or position(normalized_search in lower(u.id::text)) > 0
      or exists (select 1 from jsonb_array_elements(coalesce(child_summary.payload -> 'children', '[]'::jsonb)) child_entry
        where position(normalized_search in lower(coalesce(child_entry ->> 'name', ''))) > 0)
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
      'childCount', f.child_count, 'children', f.children, 'activeChildId', f.active_child_id,
      'childSource', f.child_source, 'plan', coalesce(f.plan, 'free'),
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
      'childCount', coalesce((child_summary.payload ->> 'childCount')::integer, 0),
      'activeChildId', coalesce(child_summary.payload ->> 'activeChildId', ''),
      'childSource', coalesce(child_summary.payload ->> 'source', 'learner_profiles')),
    'subscription', public.premium_entitlement_payload(u.id),
    'children', coalesce(child_summary.payload -> 'children', '[]'::jsonb),
    'activeChildId', coalesce(child_summary.payload ->> 'activeChildId', ''),
    'payments', coalesce((select jsonb_agg(to_jsonb(payment_row) order by payment_row."createdAt" desc) from (
      select pr.id, pr.request_id "requestId", pr.action, pr.amount, pr.currency, pr.payment_method "paymentMethod", pr.payment_reference "paymentReference",
        pr.payment_status "paymentStatus", pr.paid_at "paidAt", pr.subscription_days_added "subscriptionDaysAdded",
        pr.previous_expiry "previousExpiry", pr.new_expiry "newExpiry", pr.notes, pr.recorded_by "recordedBy", pr.created_at "createdAt"
      from public.premium_payment_records pr where pr.account_id = u.id order by pr.created_at desc limit 50
    ) payment_row), '[]'::jsonb),
    'auditHistory', coalesce((select jsonb_agg(to_jsonb(audit_row) order by audit_row."createdAt" desc) from (
      select a.id, a.request_id "requestId", a.action, a.old_status "oldStatus", a.new_status "newStatus", a.old_expiry "oldExpiry",
        a.new_expiry "newExpiry", a.reason, a.before_state "beforeState", a.after_state "afterState",
        a.admin_user_id "adminUserId", a.created_at "createdAt"
      from public.premium_admin_audit_log a where a.target_user_id = u.id order by a.created_at desc limit 100
    ) audit_row), '[]'::jsonb), 'serverNow', now()
  ) into response_payload from auth.users u left join public.profiles p on p.id = u.id
    cross join lateral (select public.admin_child_summary_payload(u.id) payload) child_summary where u.id = $1;
  return response_payload;
end;
$$;

create or replace function public.admin_verify_subscription_request(target_request_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  audit_row public.premium_admin_audit_log%rowtype;
  payment_row public.premium_payment_records%rowtype;
  entitlement_payload jsonb;
  audit_found boolean := false;
  payment_found boolean := false;
  payment_expected boolean := false;
  entitlement_matches boolean := null;
  result_status text := 'not_found';
  resolved_account_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null then raise exception 'request_id_required'; end if;

  -- An uncommitted mutation must not be reported as absent. VOLATILE keeps
  -- subsequent reads on a fresh snapshot after acquiring the request lock.
  if not pg_try_advisory_xact_lock(hashtextextended('admin-subscription:' || $1::text, 0)) then
    return jsonb_build_object('requestId', $1, 'status', 'in_progress', 'serverNow', now());
  end if;

  select * into audit_row
  from public.premium_admin_audit_log a
  where a.request_id = $1
  order by a.created_at desc limit 1;
  audit_found := found;

  select * into payment_row
  from public.premium_payment_records p
  where p.request_id = $1
  order by p.created_at desc limit 1;
  payment_found := found;

  if not audit_found and not payment_found then
    return jsonb_build_object(
      'requestId', $1, 'status', 'not_found', 'found', false,
      'auditRecordFound', false, 'paymentRecordFound', false,
      'entitlementMatches', null, 'serverNow', now()
    );
  end if;

  resolved_account_id := case when audit_found then audit_row.target_user_id else payment_row.account_id end;
  entitlement_payload := public.premium_entitlement_payload(resolved_account_id);
  payment_expected := audit_found and audit_row.action in (
    'ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY',
    'START_TRIAL', 'MARK_COMPLIMENTARY'
  );

  if audit_found then
    entitlement_matches := (entitlement_payload ->> 'storedStatus') is not distinct from audit_row.new_status
      and (entitlement_payload ->> 'expiresAt')::timestamptz is not distinct from audit_row.new_expiry
      and coalesce((entitlement_payload ->> 'isPermanent')::boolean, false)
        = coalesce((audit_row.after_state ->> 'isPermanent')::boolean, false);
  end if;

  result_status := case
    when audit_found and (not payment_expected or payment_found) then 'success'
    else 'incomplete'
  end;

  return jsonb_build_object(
    'requestId', $1,
    'found', true,
    'status', result_status,
    'accountId', resolved_account_id,
    'action', case when audit_found then audit_row.action else payment_row.action end,
    'previousExpiry', case when audit_found then audit_row.old_expiry else payment_row.previous_expiry end,
    'newExpiry', case when audit_found then audit_row.new_expiry else payment_row.new_expiry end,
    'auditRecordFound', audit_found,
    'paymentExpected', payment_expected,
    'paymentRecordFound', payment_found,
    'entitlementMatches', entitlement_matches,
    'effectiveStatus', entitlement_payload ->> 'effectiveStatus',
    'accessAllowed', coalesce((entitlement_payload ->> 'accessAllowed')::boolean, false),
    'revision', coalesce((entitlement_payload ->> 'revision')::bigint, 0),
    'payment', case when payment_found then jsonb_build_object(
      'id', payment_row.id, 'amount', payment_row.amount, 'currency', payment_row.currency,
      'paymentMethod', payment_row.payment_method, 'paymentReference', payment_row.payment_reference,
      'paymentStatus', payment_row.payment_status, 'createdAt', payment_row.created_at
    ) else null end,
    'serverNow', now()
  );
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
  replay_audit public.premium_admin_audit_log%rowtype;
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
  perform pg_advisory_xact_lock(hashtextextended('admin-subscription:' || $8::text, 0));
  perform pg_advisory_xact_lock(hashtextextended($1::text, 0));
  select * into replay_audit from public.premium_admin_audit_log a where a.request_id = $8 limit 1;
  if found then
    if replay_audit.target_user_id <> $1 or replay_audit.action <> normalized_action then raise exception 'request_id_conflict'; end if;
    return public.admin_verify_subscription_request($8) || jsonb_build_object('ok', true, 'duplicate', true, 'idempotentReplay', true);
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
    insert into public.premium_payment_records as pr(request_id, account_id, action, amount, currency, payment_method, payment_reference, payment_status, paid_at, subscription_days_added, previous_expiry, new_expiry, notes, recorded_by)
      values($8, $1, normalized_action, coalesce($10, 0), normalized_currency, normalized_method, normalized_reference,
        normalized_payment_status, case when normalized_payment_status = 'paid' then coalesce($15, server_now) else $15 end,
        days_added, old_expiry, next_expiry, normalized_note, caller_id)
      returning jsonb_build_object('id', pr.id, 'amount', pr.amount, 'currency', pr.currency, 'paymentMethod', pr.payment_method,
        'paymentReference', pr.payment_reference, 'paymentStatus', pr.payment_status, 'createdAt', pr.created_at) into payment_payload;
  end if;
  insert into public.premium_admin_audit_log(request_id, admin_user_id, target_user_id, action, old_status, new_status, old_expiry, new_expiry, reason, before_state, after_state)
    values($8, caller_id, $1, normalized_action, old_status, next_status, old_expiry, next_expiry, normalized_note, old_state, next_state);
  return public.premium_entitlement_payload($1) || jsonb_build_object(
    'ok', true, 'duplicate', false, 'idempotentReplay', false,
    'requestId', $8, 'accountId', $1, 'action', normalized_action,
    'previousExpiry', old_expiry, 'newExpiry', next_expiry,
    'payment', payment_payload
  );
end;
$$;

revoke all on function public.admin_console_summary() from public, anon, authenticated;
revoke all on function public.admin_manage_premium_entitlement(uuid, text, integer, timestamptz, text, text, text, uuid) from authenticated;
revoke all on function public.admin_child_summary_payload(uuid) from public, anon, authenticated;
revoke all on function public.admin_search_customers(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_get_customer_details(uuid) from public, anon, authenticated;
revoke all on function public.admin_verify_subscription_request(uuid) from public, anon, authenticated;
revoke all on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_console_summary() to authenticated, postgres, service_role;
grant execute on function public.admin_child_summary_payload(uuid) to postgres, service_role;
grant execute on function public.admin_search_customers(text, text, integer, integer) to authenticated, postgres, service_role;
grant execute on function public.admin_get_customer_details(uuid) to authenticated, postgres, service_role;
grant execute on function public.admin_verify_subscription_request(uuid) to authenticated, postgres, service_role;
grant execute on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) to authenticated, postgres, service_role;
