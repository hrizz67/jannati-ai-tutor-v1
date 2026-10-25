-- P1.17 guardian consent gate for Quiz MediaRecorder -> Cloudflare STT.
-- Stores decision metadata only. Audio and transcripts are never accepted here.

begin;

create table if not exists public.quiz_stt_guardian_consent_events (
  id bigint generated always as identity primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  child_id text not null check (
    length(child_id) between 7 and 200
    and child_id ~ '^child-[A-Za-z0-9._:-]+$'
  ),
  consent_token uuid not null default gen_random_uuid() unique,
  decision text not null check (decision in ('granted', 'revoked')),
  notice_version text not null check (
    length(notice_version) between 1 and 64
    and notice_version ~ '^[a-z0-9._-]+$'
  ),
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists quiz_stt_guardian_consent_account_child_created_idx
  on public.quiz_stt_guardian_consent_events (account_id, child_id, created_at desc, id desc);

alter table public.quiz_stt_guardian_consent_events enable row level security;

revoke all on table public.quiz_stt_guardian_consent_events from public, anon, authenticated;
grant all on table public.quiz_stt_guardian_consent_events to service_role;

create or replace function public._quiz_stt_account_owns_child_v1(
  p_account_id uuid,
  p_child_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cloud_payload jsonb;
  child_state_text text;
  child_state jsonb;
begin
  if p_account_id is null
     or p_child_id is null
     or length(p_child_id) < 7
     or length(p_child_id) > 200
     or p_child_id !~ '^child-[A-Za-z0-9._:-]+$' then
    return false;
  end if;

  select coalesce(profile_row.learning_data, '{}'::jsonb)
    into cloud_payload
  from public.profiles as profile_row
  where profile_row.id = p_account_id;

  if cloud_payload is null or jsonb_typeof(cloud_payload) <> 'object' then
    return false;
  end if;

  child_state_text := cloud_payload ->> 'jannati_cloud_child_state';
  if coalesce(child_state_text, '') = '' then
    -- Legacy projections cannot prove deleted/archived state. Require the
    -- canonical cloud envelope so child ownership always fails closed.
    return false;
  end if;

  begin
    child_state := child_state_text::jsonb;
  exception when others then
    return false;
  end;
  if jsonb_typeof(child_state) <> 'object'
     or jsonb_typeof(child_state -> 'profiles') <> 'array' then
    return false;
  end if;
  if coalesce(child_state -> 'deletedChildren', '{}'::jsonb) ? p_child_id
     or coalesce(child_state -> 'archivedChildren', '{}'::jsonb) ? p_child_id then
    return false;
  end if;
  return exists (
    select 1 from jsonb_array_elements(child_state -> 'profiles') as child
    where child ->> 'id' = p_child_id
  );
end;
$$;

create or replace function public.get_quiz_stt_guardian_consent_v1(p_child_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  owns_child boolean;
  latest_decision text;
  latest_notice_version text;
  latest_changed_at timestamptz;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  owns_child := public._quiz_stt_account_owns_child_v1(caller_id, p_child_id);
  if not owns_child then
    return jsonb_build_object(
      'eligible', false,
      'granted', false,
      'status', 'child-not-found',
      'noticeVersion', null,
      'changedAt', null
    );
  end if;

  select event.decision, event.notice_version, event.created_at
    into latest_decision, latest_notice_version, latest_changed_at
  from public.quiz_stt_guardian_consent_events as event
  where event.account_id = caller_id and event.child_id = p_child_id
  order by event.created_at desc, event.id desc
  limit 1;

  return jsonb_build_object(
    'eligible', true,
    'granted', latest_decision = 'granted',
    'status', coalesce(latest_decision, 'missing'),
    'consentToken', case when latest_decision = 'granted' then (
      select event.consent_token::text
      from public.quiz_stt_guardian_consent_events as event
      where event.account_id = caller_id and event.child_id = p_child_id
      order by event.created_at desc, event.id desc
      limit 1
    ) else null end,
    'noticeVersion', latest_notice_version,
    'changedAt', latest_changed_at
  );
end;
$$;

create or replace function public.verify_quiz_stt_guardian_consent_v1(p_consent_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  matched_child_id text;
  matched_event_id bigint;
  latest_event_id bigint;
  latest_decision text;
  latest_notice_version text;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if p_consent_token is null then
    return jsonb_build_object('granted', false, 'status', 'missing', 'noticeVersion', null);
  end if;

  select event.child_id, event.id
    into matched_child_id, matched_event_id
  from public.quiz_stt_guardian_consent_events as event
  where event.account_id = caller_id and event.consent_token = p_consent_token
  limit 1;

  if matched_event_id is null then
    return jsonb_build_object('granted', false, 'status', 'missing', 'noticeVersion', null);
  end if;

  select event.id, event.decision, event.notice_version
    into latest_event_id, latest_decision, latest_notice_version
  from public.quiz_stt_guardian_consent_events as event
  where event.account_id = caller_id and event.child_id = matched_child_id
  order by event.created_at desc, event.id desc
  limit 1;

  return jsonb_build_object(
    'granted', matched_event_id = latest_event_id and latest_decision = 'granted',
    'status', case
      when matched_event_id = latest_event_id and latest_decision = 'granted' then 'granted'
      else 'revoked'
    end,
    'noticeVersion', latest_notice_version
  );
end;
$$;

create or replace function public.set_quiz_stt_guardian_consent_v1(
  p_child_id text,
  p_granted boolean,
  p_notice_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  requested_decision text;
  latest_decision text;
  latest_notice_version text;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if p_granted is null then raise exception 'consent_decision_required'; end if;
  if p_notice_version is null
     or length(p_notice_version) < 1
     or length(p_notice_version) > 64
     or p_notice_version !~ '^[a-z0-9._-]+$' then
    raise exception 'invalid_notice_version';
  end if;
  if not public._quiz_stt_account_owns_child_v1(caller_id, p_child_id) then
    raise exception 'child_not_owned';
  end if;

  requested_decision := case when p_granted then 'granted' else 'revoked' end;
  select event.decision, event.notice_version
    into latest_decision, latest_notice_version
  from public.quiz_stt_guardian_consent_events as event
  where event.account_id = caller_id and event.child_id = p_child_id
  order by event.created_at desc, event.id desc
  limit 1;

  if latest_decision is distinct from requested_decision
     or latest_notice_version is distinct from p_notice_version then
    insert into public.quiz_stt_guardian_consent_events (
      account_id, child_id, decision, notice_version
    ) values (
      caller_id, p_child_id, requested_decision, p_notice_version
    );
  end if;

  return public.get_quiz_stt_guardian_consent_v1(p_child_id);
end;
$$;

revoke all on function public._quiz_stt_account_owns_child_v1(uuid, text) from public, anon, authenticated;
revoke all on function public.get_quiz_stt_guardian_consent_v1(text) from public, anon, authenticated;
revoke all on function public.verify_quiz_stt_guardian_consent_v1(uuid) from public, anon, authenticated;
revoke all on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text) from public, anon, authenticated;

grant execute on function public.get_quiz_stt_guardian_consent_v1(text) to authenticated;
grant execute on function public.verify_quiz_stt_guardian_consent_v1(uuid) to authenticated;
grant execute on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text) to authenticated;
grant execute on function public.get_quiz_stt_guardian_consent_v1(text) to postgres, service_role;
grant execute on function public.verify_quiz_stt_guardian_consent_v1(uuid) to postgres, service_role;
grant execute on function public.set_quiz_stt_guardian_consent_v1(text, boolean, text) to postgres, service_role;

commit;
