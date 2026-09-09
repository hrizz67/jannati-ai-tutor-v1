begin;

-- PostgreSQL 42702 hotfix: keep the public PostgREST signature unchanged and
-- qualify the payment row returned by the INSERT. Function arguments named
-- payment_method/payment_reference/payment_status otherwise collide with the
-- identically named premium_payment_records columns inside RETURNING.
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
  replay_audit public.premium_admin_audit_log%rowtype;
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

  perform pg_advisory_xact_lock(hashtextextended('admin-subscription:' || $8::text, 0));
  perform pg_advisory_xact_lock(hashtextextended($1::text, 0));
  select * into replay_audit from public.premium_admin_audit_log a where a.request_id = $8 limit 1;
  if found then
    if replay_audit.target_user_id <> $1 or replay_audit.action <> normalized_action then raise exception 'request_id_conflict'; end if;
    return public.admin_verify_subscription_request($8)
      || jsonb_build_object('ok', true, 'duplicate', true, 'idempotentReplay', true);
  end if;

  select * into old_entitlement from public.premium_entitlements e where e.account_id = $1 for update;
  if found then
    old_status := old_entitlement.status; old_plan := old_entitlement.plan;
    old_expiry := old_entitlement.expires_at; old_permanent := old_entitlement.is_permanent;
    entitlement_active := old_entitlement.status in ('active', 'trial', 'complimentary')
      and (old_entitlement.is_permanent or old_entitlement.expires_at > server_now);
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
    'previousExpiry', old_expiry, 'newExpiry', next_expiry, 'payment', payment_payload
  );
end;
$$;

revoke all on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_apply_subscription_change(uuid, text, integer, timestamptz, text, text, text, uuid, boolean, numeric, text, text, text, text, timestamptz) to authenticated, postgres, service_role;

commit;
