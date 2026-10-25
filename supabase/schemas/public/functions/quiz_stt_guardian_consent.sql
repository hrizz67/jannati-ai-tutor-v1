-- Declarative mirror of 20261025090000_quiz_stt_guardian_consent.sql.
-- The forward migration is the reviewed source for these three functions.

create or replace function public._quiz_stt_account_owns_child_v1(p_account_id uuid, p_child_id text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare cloud_payload jsonb; child_state_text text; child_state jsonb;
begin
  if p_account_id is null or p_child_id is null or length(p_child_id) < 7 or length(p_child_id) > 200 or p_child_id !~ '^child-[A-Za-z0-9._:-]+$' then return false; end if;
  select coalesce(profile_row.learning_data, '{}'::jsonb) into cloud_payload from public.profiles as profile_row where profile_row.id = p_account_id;
  if cloud_payload is null or jsonb_typeof(cloud_payload) <> 'object' then return false; end if;
  child_state_text := cloud_payload ->> 'jannati_cloud_child_state';
  if coalesce(child_state_text, '') = '' then
    return false;
  end if;
  begin child_state := child_state_text::jsonb; exception when others then return false; end;
  if jsonb_typeof(child_state) <> 'object' or jsonb_typeof(child_state -> 'profiles') <> 'array' then return false; end if;
  if coalesce(child_state -> 'deletedChildren', '{}'::jsonb) ? p_child_id or coalesce(child_state -> 'archivedChildren', '{}'::jsonb) ? p_child_id then return false; end if;
  return exists (select 1 from jsonb_array_elements(child_state -> 'profiles') as child where child ->> 'id' = p_child_id);
end; $$;

create or replace function public.begin_quiz_stt_guardian_authorization_v1(p_child_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  jwt_claims jsonb := auth.jwt();
  initial_session_id text;
  existing_challenge_id bigint;
  existing_challenge_token uuid;
  existing_created_at timestamptz;
  existing_expires_at timestamptz;
  existing_used_at timestamptz;
  challenge uuid;
  challenge_expires_at timestamptz;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if coalesce(jwt_claims ->> 'is_anonymous', 'true') <> 'false' then raise exception 'guardian_authorization_required'; end if;
  if not public._quiz_stt_account_owns_child_v1(caller_id, p_child_id) then raise exception 'child_not_owned'; end if;
  initial_session_id := jwt_claims ->> 'session_id';
  if coalesce(initial_session_id, '') = '' or length(initial_session_id) > 200 then raise exception 'guardian_authorization_required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('quiz-stt-challenge:' || caller_id::text || ':' || p_child_id, 0)
  );
  -- Lazy retention: stale rows for this account are removed opportunistically
  -- on a later begin call. This is not a scheduled/global 24-hour deletion SLA.
  delete from public.quiz_stt_guardian_authorization_challenges as stale
  where stale.account_id = caller_id
    and stale.created_at < pg_catalog.now() - interval '24 hours';

  select challenge_row.id, challenge_row.challenge_token, challenge_row.created_at,
         challenge_row.expires_at, challenge_row.used_at
    into existing_challenge_id, existing_challenge_token, existing_created_at,
         existing_expires_at, existing_used_at
  from public.quiz_stt_guardian_authorization_challenges as challenge_row
  where challenge_row.account_id = caller_id
    and challenge_row.child_id = p_child_id
  for update;

  if existing_challenge_id is not null
     and existing_used_at is null
     and existing_expires_at > pg_catalog.now() then
    return jsonb_build_object(
      'challengeToken', existing_challenge_token::text,
      'expiresAt', existing_expires_at
    );
  end if;
  if existing_challenge_id is not null
     and existing_created_at > pg_catalog.now() - interval '30 seconds' then
    raise exception 'guardian_authorization_rate_limited';
  end if;

  challenge := extensions.gen_random_uuid();
  challenge_expires_at := pg_catalog.now() + interval '5 minutes';
  if existing_challenge_id is null then
    insert into public.quiz_stt_guardian_authorization_challenges (
      account_id, child_id, challenge_token, initial_session_hash, expires_at
    ) values (
      caller_id, p_child_id, challenge,
      extensions.digest(pg_catalog.convert_to(initial_session_id, 'UTF8'), 'sha256'),
      challenge_expires_at
    );
  else
    update public.quiz_stt_guardian_authorization_challenges
    set challenge_token = challenge,
        initial_session_hash = extensions.digest(pg_catalog.convert_to(initial_session_id, 'UTF8'), 'sha256'),
        created_at = pg_catalog.now(),
        expires_at = challenge_expires_at,
        used_at = null
    where id = existing_challenge_id;
  end if;
  return jsonb_build_object('challengeToken', challenge::text, 'expiresAt', challenge_expires_at);
end; $$;

create or replace function public.get_quiz_stt_guardian_consent_v1(p_child_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); owns_child boolean; latest_decision text; latest_notice_version text; latest_changed_at timestamptz;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  owns_child := public._quiz_stt_account_owns_child_v1(caller_id, p_child_id);
  if not owns_child then return jsonb_build_object('eligible', false, 'granted', false, 'status', 'child-not-found', 'noticeVersion', null, 'changedAt', null); end if;
  select event.decision, event.notice_version, event.created_at into latest_decision, latest_notice_version, latest_changed_at from public.quiz_stt_guardian_consent_events as event where event.account_id = caller_id and event.child_id = p_child_id order by event.created_at desc, event.id desc limit 1;
  return jsonb_build_object('eligible', true, 'granted', latest_decision = 'granted', 'status', coalesce(latest_decision, 'missing'), 'consentToken', case when latest_decision = 'granted' then (select event.consent_token::text from public.quiz_stt_guardian_consent_events as event where event.account_id = caller_id and event.child_id = p_child_id order by event.created_at desc, event.id desc limit 1) else null end, 'noticeVersion', latest_notice_version, 'changedAt', latest_changed_at);
end; $$;

create or replace function public.verify_quiz_stt_guardian_consent_v1(p_consent_token uuid, p_child_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); matched_child_id text; matched_event_id bigint; latest_event_id bigint; latest_decision text; latest_notice_version text; owns_active_child boolean;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if p_consent_token is null then return jsonb_build_object('granted', false, 'status', 'missing', 'noticeVersion', null); end if;
  select event.child_id, event.id into matched_child_id, matched_event_id from public.quiz_stt_guardian_consent_events as event where event.account_id = caller_id and event.consent_token = p_consent_token limit 1;
  if matched_event_id is null then return jsonb_build_object('granted', false, 'status', 'missing', 'noticeVersion', null); end if;
  if matched_child_id is distinct from p_child_id then return jsonb_build_object('granted', false, 'status', 'child-mismatch', 'noticeVersion', null); end if;
  owns_active_child := public._quiz_stt_account_owns_child_v1(caller_id, matched_child_id);
  if not owns_active_child then return jsonb_build_object('granted', false, 'status', 'child-not-active', 'noticeVersion', null); end if;
  select event.id, event.decision, event.notice_version into latest_event_id, latest_decision, latest_notice_version from public.quiz_stt_guardian_consent_events as event where event.account_id = caller_id and event.child_id = matched_child_id order by event.created_at desc, event.id desc limit 1;
  return jsonb_build_object('granted', matched_event_id = latest_event_id and latest_decision = 'granted', 'status', case when matched_event_id = latest_event_id and latest_decision = 'granted' then 'granted' else 'revoked' end, 'noticeVersion', latest_notice_version);
end; $$;

create or replace function public.set_quiz_stt_guardian_consent_v1(p_child_id text, p_granted boolean, p_notice_version text, p_guardian_challenge uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid(); requested_decision text; latest_decision text; latest_notice_version text;
  jwt_claims jsonb := auth.jwt(); current_session_id text; current_session_hash bytea; initial_session_hash bytea;
  challenge_id bigint; challenge_created_at timestamptz; password_auth_at bigint; consumed_challenge_id bigint;
  canonical_notice_version constant text := 'quiz-stt-cloudflare-bm-v1';
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if p_granted is null then raise exception 'consent_decision_required'; end if;
  if p_notice_version is distinct from canonical_notice_version then raise exception 'invalid_notice_version'; end if;
  if not public._quiz_stt_account_owns_child_v1(caller_id, p_child_id) then raise exception 'child_not_owned'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('quiz-stt-consent:' || caller_id::text || ':' || p_child_id, 0)
  );

  if p_granted then
    if p_guardian_challenge is null or coalesce(jwt_claims ->> 'is_anonymous', 'true') <> 'false' then raise exception 'guardian_authorization_required'; end if;
    select challenge_row.id, challenge_row.initial_session_hash, challenge_row.created_at into challenge_id, initial_session_hash, challenge_created_at
    from public.quiz_stt_guardian_authorization_challenges as challenge_row
    where challenge_row.account_id = caller_id and challenge_row.child_id = p_child_id and challenge_row.challenge_token = p_guardian_challenge and challenge_row.used_at is null and challenge_row.expires_at > pg_catalog.now()
    for update;
    current_session_id := jwt_claims ->> 'session_id';
    if challenge_id is null or coalesce(current_session_id, '') = '' or length(current_session_id) > 200 then raise exception 'guardian_authorization_required'; end if;
    current_session_hash := extensions.digest(pg_catalog.convert_to(current_session_id, 'UTF8'), 'sha256');
    if current_session_hash = initial_session_hash then raise exception 'guardian_reauthentication_required'; end if;
    select max((method ->> 'timestamp')::bigint) into password_auth_at
    from jsonb_array_elements(coalesce(jwt_claims -> 'amr', '[]'::jsonb)) as method
    where method ->> 'method' = 'password' and coalesce(method ->> 'timestamp', '') ~ '^[0-9]{1,20}$';
    if password_auth_at is null or password_auth_at < pg_catalog.floor(extract(epoch from challenge_created_at))::bigint then raise exception 'guardian_reauthentication_required'; end if;
    update public.quiz_stt_guardian_authorization_challenges set used_at = pg_catalog.now() where id = challenge_id and used_at is null returning id into consumed_challenge_id;
    if consumed_challenge_id is null then raise exception 'guardian_authorization_required'; end if;
  end if;
  requested_decision := case when p_granted then 'granted' else 'revoked' end;
  select event.decision, event.notice_version into latest_decision, latest_notice_version from public.quiz_stt_guardian_consent_events as event where event.account_id = caller_id and event.child_id = p_child_id order by event.created_at desc, event.id desc limit 1;
  if latest_decision is distinct from requested_decision or latest_notice_version is distinct from p_notice_version then insert into public.quiz_stt_guardian_consent_events (account_id, child_id, decision, notice_version) values (caller_id, p_child_id, requested_decision, p_notice_version); end if;

  if not p_granted then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('quiz-stt-challenge:' || caller_id::text || ':' || p_child_id, 0)
    );
    update public.quiz_stt_guardian_authorization_challenges
    set used_at = pg_catalog.now()
    where account_id = caller_id
      and child_id = p_child_id
      and used_at is null;
  end if;

  return public.get_quiz_stt_guardian_consent_v1(p_child_id);
end; $$;

revoke all on function public._quiz_stt_account_owns_child_v1(uuid, text) from public, anon, authenticated;
revoke all on function public.begin_quiz_stt_guardian_authorization_v1(text) from public, anon, authenticated;
revoke all on function public.get_quiz_stt_guardian_consent_v1(text) from public, anon, authenticated;
revoke all on function public.verify_quiz_stt_guardian_consent_v1(uuid, text) from public, anon, authenticated;
revoke all on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.begin_quiz_stt_guardian_authorization_v1(text) to authenticated;
grant execute on function public.get_quiz_stt_guardian_consent_v1(text) to authenticated;
grant execute on function public.verify_quiz_stt_guardian_consent_v1(uuid, text) to authenticated;
grant execute on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text, uuid) to authenticated;
grant execute on function public.begin_quiz_stt_guardian_authorization_v1(text) to postgres, service_role;
grant execute on function public.get_quiz_stt_guardian_consent_v1(text) to postgres, service_role;
grant execute on function public.verify_quiz_stt_guardian_consent_v1(uuid, text) to postgres, service_role;
grant execute on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text, uuid) to postgres, service_role;
