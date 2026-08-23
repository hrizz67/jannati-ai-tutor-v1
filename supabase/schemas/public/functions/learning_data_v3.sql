create or replace function public.get_learning_data_v3()
  returns jsonb
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  caller_id uuid := auth.uid();
  current_payload jsonb;
  current_revision bigint;
  current_updated_at timestamp with time zone;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;

  insert into public.profiles (id, display_name, access_status, learning_sync_version)
  values (caller_id, 'Murid', 'free', 3)
  on conflict (id) do nothing;

  select coalesce(learning_data, '{}'::jsonb), learning_revision, updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles where id = caller_id;

  return jsonb_build_object(
    'protocolVersion', 3,
    'payload', current_payload,
    'revision', current_revision,
    'serverUpdatedAt', current_updated_at
  );
end;
$function$;

create or replace function public.save_learning_data_v3(
  payload jsonb,
  expected_revision bigint,
  operation_id uuid,
  device_id text,
  dirty_child_ids text[]
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  caller_id uuid := auth.uid();
  current_payload jsonb;
  current_revision bigint;
  next_revision bigint;
  current_updated_at timestamp with time zone;
  prior_status text;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if operation_id is null then raise exception 'operation_id_required'; end if;
  if expected_revision is null or expected_revision < 0 then raise exception 'invalid_expected_revision'; end if;
  if coalesce(device_id, '') = '' then raise exception 'device_id_required'; end if;
  if jsonb_typeof(coalesce(payload, '{}'::jsonb)) <> 'object' then raise exception 'invalid_learning_payload'; end if;
  if pg_column_size(coalesce(payload, '{}'::jsonb)) > 8388608 then raise exception 'learning_payload_too_large'; end if;
  if cardinality(coalesce(dirty_child_ids, '{}'::text[])) > 100 then raise exception 'too_many_dirty_children'; end if;

  insert into public.profiles (id, display_name, access_status, learning_sync_version)
  values (caller_id, 'Murid', 'free', 3)
  on conflict (id) do nothing;

  select coalesce(learning_data, '{}'::jsonb), learning_revision, updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles where id = caller_id for update;

  select operation_log.status into prior_status
  from public.learning_sync_operations as operation_log
  where operation_log.operation_id = save_learning_data_v3.operation_id
    and operation_log.account_id = caller_id;

  if prior_status = 'applied' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'conflict', false,
      'payload', current_payload, 'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;
  if prior_status = 'conflict' then
    return jsonb_build_object('ok', false, 'duplicate', true, 'conflict', true,
      'payload', current_payload, 'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;

  if current_revision <> expected_revision then
    insert into public.learning_sync_operations (
      operation_id, account_id, device_id, expected_revision,
      resulting_revision, status, dirty_child_ids, submitted_payload
    ) values (
      operation_id, caller_id, left(device_id, 200), expected_revision,
      current_revision, 'conflict', coalesce(dirty_child_ids, '{}'::text[]), coalesce(payload, '{}'::jsonb)
    ) on conflict (operation_id) do nothing;
    return jsonb_build_object('ok', false, 'duplicate', false, 'conflict', true,
      'payload', current_payload, 'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;

  insert into public.learning_data_backups (account_id, revision, reason, payload)
  values (caller_id, current_revision, 'pre-write', current_payload)
  on conflict (account_id, revision, reason) do nothing;

  next_revision := current_revision + 1;
  update public.profiles
  set learning_data = coalesce(payload, '{}'::jsonb),
      learning_revision = next_revision,
      learning_sync_version = 3,
      updated_at = now()
  where id = caller_id;

  insert into public.learning_sync_operations (
    operation_id, account_id, device_id, expected_revision,
    resulting_revision, status, dirty_child_ids, submitted_payload
  ) values (
    operation_id, caller_id, left(device_id, 200), expected_revision,
    next_revision, 'applied', coalesce(dirty_child_ids, '{}'::text[]), coalesce(payload, '{}'::jsonb)
  ) on conflict (operation_id) do nothing;

  return jsonb_build_object('ok', true, 'duplicate', false, 'conflict', false,
    'payload', coalesce(payload, '{}'::jsonb), 'revision', next_revision, 'serverUpdatedAt', now());
end;
$function$;

create or replace function public.append_learning_event_v1(
  event_id uuid,
  legacy_child_id text,
  device_id text,
  event_type text,
  payload jsonb,
  client_created_at timestamp with time zone default null
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if event_id is null or coalesce(legacy_child_id, '') = '' or coalesce(device_id, '') = '' then
    raise exception 'invalid_learning_event_identity';
  end if;
  if pg_column_size(coalesce(payload, '{}'::jsonb)) > 1048576 then raise exception 'learning_event_too_large'; end if;

  insert into public.learning_events (
    event_id, account_id, legacy_child_id, device_id, event_type, payload, client_created_at
  ) values (
    event_id, caller_id, left(legacy_child_id, 200), left(device_id, 200),
    left(coalesce(event_type, 'snapshot-checkpoint'), 100), coalesce(payload, '{}'::jsonb), client_created_at
  ) on conflict (event_id) do nothing;

  return jsonb_build_object('ok', true, 'eventId', event_id);
end;
$function$;

create or replace function public.archive_learner_profile_v1(
  learner_profile_id uuid,
  expected_revision bigint
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  caller_id uuid := auth.uid();
  next_revision bigint;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;

  update public.learner_profiles
  set archived_at = coalesce(archived_at, now()), revision = revision + 1, updated_at = now()
  where id = learner_profile_id and account_id = caller_id and revision = expected_revision
  returning revision into next_revision;

  if next_revision is null then return jsonb_build_object('ok', false, 'conflict', true); end if;
  return jsonb_build_object('ok', true, 'conflict', false, 'revision', next_revision);
end;
$function$;

revoke all on function public.get_learning_data_v3() from public, anon, authenticated;
revoke all on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) from public, anon, authenticated;
revoke all on function public.archive_learner_profile_v1(uuid, bigint) from public, anon, authenticated;
grant execute on function public.get_learning_data_v3() to authenticated;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to authenticated;
grant execute on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) to authenticated;
grant execute on function public.archive_learner_profile_v1(uuid, bigint) to authenticated;
grant execute on function public.get_learning_data_v3() to postgres, service_role;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to postgres, service_role;
grant execute on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) to postgres, service_role;
grant execute on function public.archive_learner_profile_v1(uuid, bigint) to postgres, service_role;
