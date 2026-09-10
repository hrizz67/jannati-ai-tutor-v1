begin;

-- Admin child visibility follows the same authoritative account payload used
-- by save_learning_data_v3. Only bounded profile metadata leaves the server;
-- snapshots, progress, answers and other learning content are never returned.
create or replace function public.admin_child_summary_payload(target_account_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
  if $1 is null or not exists (select 1 from auth.users as account_user where account_user.id = $1) then
    raise exception 'target_user_not_found';
  end if;

  select coalesce(account_profile.learning_data, '{}'::jsonb)
    into account_learning_data
  from public.profiles as account_profile
  where account_profile.id = $1;

  encoded_child_state := account_learning_data -> 'jannati_cloud_child_state';
  if encoded_child_state is not null then
    begin
      canonical_child_state := case jsonb_typeof(encoded_child_state)
        when 'object' then encoded_child_state
        when 'string' then (encoded_child_state #>> '{}')::jsonb
        else null
      end;
    exception when others then
      canonical_child_state := null;
    end;
  end if;

  canonical_shape_valid := jsonb_typeof(canonical_child_state) = 'object'
    and jsonb_typeof(canonical_child_state -> 'profiles') = 'array';

  if canonical_shape_valid then
    raw_active_child_id := trim(coalesce(canonical_child_state ->> 'activeChildId', ''));

    with profile_candidates as (
      select
        profile_entry.profile_ordinal,
        trim(profile_entry.profile_value ->> 'id') as child_id,
        trim(profile_entry.profile_value ->> 'name') as child_name,
        trim(coalesce(profile_entry.profile_value ->> 'year', '')) as child_year,
        trim(coalesce(profile_entry.profile_value ->> 'avatar', '')) as child_avatar
      from jsonb_array_elements(canonical_child_state -> 'profiles')
        with ordinality as profile_entry(profile_value, profile_ordinal)
      where jsonb_typeof(profile_entry.profile_value) = 'object'
    ), effective_profiles as (
      select candidate.*
      from profile_candidates as candidate
      where candidate.child_id <> ''
        and candidate.child_name <> ''
        and char_length(candidate.child_id) <= 512
        and not (
          jsonb_typeof(canonical_child_state -> 'deletedChildren') = 'object'
          and (canonical_child_state -> 'deletedChildren') ? candidate.child_id
        )
        and not (
          exists (
            select 1
            from jsonb_array_elements_text(case
              when jsonb_typeof(canonical_child_state -> 'deletedChildren') = 'array'
                then canonical_child_state -> 'deletedChildren'
              else '[]'::jsonb
            end) as deleted_entry(child_id)
            where deleted_entry.child_id = candidate.child_id
          )
        )
        and not (
          jsonb_typeof(canonical_child_state -> 'archivedChildren') = 'object'
          and jsonb_typeof((canonical_child_state -> 'archivedChildren') -> candidate.child_id) = 'object'
          and case
            when coalesce((canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'archivedAt'), '') ~ '^[0-9]+([.][0-9]+)?$'
              then (canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'archivedAt')::numeric
            else 0
          end
          > case
            when coalesce((canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'restoredAt'), '') ~ '^[0-9]+([.][0-9]+)?$'
              then (canonical_child_state -> 'archivedChildren' -> candidate.child_id ->> 'restoredAt')::numeric
            else 0
          end
        )
    ), distinct_profiles as (
      select distinct on (effective.child_id) effective.*
      from effective_profiles as effective
      order by effective.child_id, effective.profile_ordinal
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', distinct_profile.child_id,
      'name', left(distinct_profile.child_name, 200),
      'year', left(distinct_profile.child_year, 80),
      'avatar', left(distinct_profile.child_avatar, 256),
      'isActive', distinct_profile.child_id = raw_active_child_id
    ) order by distinct_profile.profile_ordinal), '[]'::jsonb)
      into children_payload
    from distinct_profiles as distinct_profile;

    select coalesce((
      select child_entry ->> 'id'
      from jsonb_array_elements(children_payload) as child_entry
      where child_entry ->> 'id' = raw_active_child_id
      limit 1
    ), '') into resolved_active_child_id;

    return jsonb_build_object(
      'childCount', jsonb_array_length(children_payload),
      'activeChildId', resolved_active_child_id,
      'children', children_payload,
      'source', 'learning_data'
    );
  end if;

  -- Legacy fallback is used only when the canonical metadata is absent or
  -- malformed. An explicitly valid empty canonical profile array stays empty.
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', coalesce(nullif(trim(legacy_profile.legacy_child_id), ''), legacy_profile.id::text),
    'name', left(trim(legacy_profile.display_name), 200),
    'year', left(trim(coalesce(legacy_profile.school_year, '')), 80),
    'avatar', left(trim(coalesce(legacy_profile.avatar, '')), 256),
    'isActive', false
  ) order by legacy_profile.created_at, legacy_profile.id), '[]'::jsonb)
    into children_payload
  from public.learner_profiles as legacy_profile
  where legacy_profile.account_id = $1
    and legacy_profile.archived_at is null
    and trim(coalesce(legacy_profile.display_name, '')) <> '';

  return jsonb_build_object(
    'childCount', jsonb_array_length(children_payload),
    'activeChildId', '',
    'children', children_payload,
    'source', 'learner_profiles'
  );
end;
$$;

create or replace function public.admin_search_customers(
  search_text text default '',
  status_filter text default 'all',
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
  normalized_filter text := lower(trim(coalesce(nullif($2, ''), 'all')));
  safe_size integer := least(greatest(coalesce($3, 20), 1), 50);
  safe_offset integer := greatest(coalesce($4, 0), 0);
  response_payload jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if normalized_filter not in ('all', 'active', 'expiring_7', 'expiring_30', 'expired', 'trial', 'complimentary') then
    raise exception 'invalid_status_filter';
  end if;

  with base as (
    select
      account_user.id as account_id,
      account_user.email,
      coalesce(nullif(trim(account_profile.display_name), ''), nullif(trim(account_user.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(account_user.email, ''), '@', 1), 'Akaun') as display_name,
      account_user.created_at,
      entitlement.plan,
      entitlement.status as stored_status,
      entitlement.starts_at,
      entitlement.expires_at,
      coalesce(entitlement.is_permanent, false) as is_permanent,
      entitlement.source,
      entitlement.notes,
      entitlement.updated_at,
      coalesce(entitlement.revision, 0) as revision,
      case
        when entitlement.account_id is null then 'free'
        when entitlement.status in ('active', 'trial', 'complimentary') and (entitlement.is_permanent or entitlement.expires_at > now()) then entitlement.status
        when entitlement.status = 'cancelled' then 'cancelled'
        else 'expired'
      end as effective_status,
      entitlement.status in ('active', 'trial', 'complimentary') and (entitlement.is_permanent or entitlement.expires_at > now()) as access_allowed,
      case
        when entitlement.is_permanent then null
        when entitlement.expires_at > now() then greatest(0, ceil(extract(epoch from (entitlement.expires_at - now())) / 86400.0)::integer)
        else 0
      end as days_remaining,
      coalesce((child_summary.payload ->> 'childCount')::integer, 0) as child_count,
      coalesce(child_summary.payload -> 'children', '[]'::jsonb) as children,
      coalesce(child_summary.payload ->> 'activeChildId', '') as active_child_id,
      coalesce(child_summary.payload ->> 'source', 'learner_profiles') as child_source,
      last_payment.payment_reference as last_payment_reference,
      last_payment.payment_status as last_payment_status,
      last_payment.notes as last_payment_note,
      last_payment.created_at as last_renewal_at
    from auth.users as account_user
    left join public.profiles as account_profile on account_profile.id = account_user.id
    left join public.premium_entitlements as entitlement on entitlement.account_id = account_user.id
    cross join lateral (
      select public.admin_child_summary_payload(account_user.id) as payload
    ) as child_summary
    left join lateral (
      select payment_record.payment_reference, payment_record.payment_status, payment_record.notes, payment_record.created_at
      from public.premium_payment_records as payment_record
      where payment_record.account_id = account_user.id
      order by payment_record.created_at desc
      limit 1
    ) as last_payment on true
    where normalized_search = ''
      or position(normalized_search in lower(coalesce(account_user.email, ''))) > 0
      or position(normalized_search in lower(coalesce(account_profile.display_name, ''))) > 0
      or position(normalized_search in lower(account_user.id::text)) > 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(child_summary.payload -> 'children', '[]'::jsonb)) as child_entry
        where position(normalized_search in lower(coalesce(child_entry ->> 'name', ''))) > 0
      )
  ), filtered as (
    select base.*, count(*) over() as total_count
    from base
    where normalized_filter = 'all'
      or (normalized_filter = 'active' and base.effective_status = 'active')
      or (normalized_filter = 'expiring_7' and base.access_allowed and not base.is_permanent and base.expires_at <= now() + interval '7 days')
      or (normalized_filter = 'expiring_30' and base.access_allowed and not base.is_permanent and base.expires_at <= now() + interval '30 days')
      or (normalized_filter = 'expired' and base.effective_status = 'expired')
      or (normalized_filter = 'trial' and base.effective_status = 'trial')
      or (normalized_filter = 'complimentary' and base.effective_status = 'complimentary')
    order by coalesce(base.updated_at, base.created_at) desc, base.account_id
    limit safe_size offset safe_offset
  )
  select jsonb_build_object(
    'accounts', coalesce(jsonb_agg(jsonb_build_object(
      'accountId', result.account_id,
      'email', result.email,
      'displayName', result.display_name,
      'createdAt', result.created_at,
      'childCount', result.child_count,
      'children', result.children,
      'activeChildId', result.active_child_id,
      'childSource', result.child_source,
      'plan', coalesce(result.plan, 'free'),
      'storedStatus', coalesce(result.stored_status, 'free'),
      'effectiveStatus', result.effective_status,
      'startsAt', result.starts_at,
      'expiresAt', result.expires_at,
      'isPermanent', result.is_permanent,
      'daysRemaining', result.days_remaining,
      'source', coalesce(result.source, 'none'),
      'notes', result.notes,
      'updatedAt', result.updated_at,
      'revision', result.revision,
      'accessAllowed', result.access_allowed,
      'lastPaymentReference', result.last_payment_reference,
      'lastPaymentStatus', result.last_payment_status,
      'lastPaymentNote', result.last_payment_note,
      'lastRenewalAt', result.last_renewal_at
    ) order by coalesce(result.updated_at, result.created_at) desc, result.account_id), '[]'::jsonb),
    'total', coalesce(max(result.total_count), 0),
    'pageSize', safe_size,
    'pageOffset', safe_offset,
    'filter', normalized_filter,
    'serverNow', now()
  ) into response_payload
  from filtered as result;

  return response_payload;
end;
$$;

create or replace function public.admin_get_customer_details(target_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  response_payload jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_current_premium_admin() then raise exception 'admin_required'; end if;
  if $1 is null or not exists (select 1 from auth.users as account_user where account_user.id = $1) then
    raise exception 'target_user_not_found';
  end if;

  select jsonb_build_object(
    'overview', jsonb_build_object(
      'accountId', account_user.id,
      'email', account_user.email,
      'displayName', coalesce(nullif(trim(account_profile.display_name), ''), nullif(trim(account_user.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(account_user.email, ''), '@', 1), 'Akaun'),
      'createdAt', account_user.created_at,
      'lastSignInAt', account_user.last_sign_in_at,
      'childCount', coalesce((child_summary.payload ->> 'childCount')::integer, 0),
      'activeChildId', coalesce(child_summary.payload ->> 'activeChildId', ''),
      'childSource', coalesce(child_summary.payload ->> 'source', 'learner_profiles')
    ),
    'subscription', public.premium_entitlement_payload(account_user.id),
    'children', coalesce(child_summary.payload -> 'children', '[]'::jsonb),
    'activeChildId', coalesce(child_summary.payload ->> 'activeChildId', ''),
    'payments', coalesce((
      select jsonb_agg(to_jsonb(payment_row) order by payment_row."createdAt" desc)
      from (
        select payment_record.id, payment_record.request_id as "requestId", payment_record.action,
          payment_record.amount, payment_record.currency, payment_record.payment_method as "paymentMethod",
          payment_record.payment_reference as "paymentReference", payment_record.payment_status as "paymentStatus",
          payment_record.paid_at as "paidAt", payment_record.subscription_days_added as "subscriptionDaysAdded",
          payment_record.previous_expiry as "previousExpiry", payment_record.new_expiry as "newExpiry",
          payment_record.notes, payment_record.recorded_by as "recordedBy", payment_record.created_at as "createdAt"
        from public.premium_payment_records as payment_record
        where payment_record.account_id = account_user.id
        order by payment_record.created_at desc
        limit 50
      ) as payment_row
    ), '[]'::jsonb),
    'auditHistory', coalesce((
      select jsonb_agg(to_jsonb(audit_row) order by audit_row."createdAt" desc)
      from (
        select audit_record.id, audit_record.request_id as "requestId", audit_record.action,
          audit_record.old_status as "oldStatus", audit_record.new_status as "newStatus",
          audit_record.old_expiry as "oldExpiry", audit_record.new_expiry as "newExpiry",
          audit_record.reason, audit_record.before_state as "beforeState", audit_record.after_state as "afterState",
          audit_record.admin_user_id as "adminUserId", audit_record.created_at as "createdAt"
        from public.premium_admin_audit_log as audit_record
        where audit_record.target_user_id = account_user.id
        order by audit_record.created_at desc
        limit 100
      ) as audit_row
    ), '[]'::jsonb),
    'serverNow', now()
  ) into response_payload
  from auth.users as account_user
  left join public.profiles as account_profile on account_profile.id = account_user.id
  cross join lateral (
    select public.admin_child_summary_payload(account_user.id) as payload
  ) as child_summary
  where account_user.id = $1;

  return response_payload;
end;
$$;

revoke all on function public.admin_child_summary_payload(uuid) from public, anon, authenticated;
revoke all on function public.admin_search_customers(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_get_customer_details(uuid) from public, anon, authenticated;
grant execute on function public.admin_child_summary_payload(uuid) to postgres, service_role;
grant execute on function public.admin_search_customers(text, text, integer, integer) to authenticated, postgres, service_role;
grant execute on function public.admin_get_customer_details(uuid) to authenticated, postgres, service_role;

commit;
