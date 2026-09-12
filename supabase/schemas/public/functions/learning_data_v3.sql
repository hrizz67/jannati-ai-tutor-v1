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

  select coalesce(profile_row.learning_data, '{}'::jsonb), profile_row.learning_revision, profile_row.updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles as profile_row
  where profile_row.id = caller_id;

  -- Normal reads are read-only. Retain a one-time compatibility fallback for
  -- historical authenticated accounts whose profile trigger did not run.
  if not found then
    insert into public.profiles (id, display_name, access_status, learning_sync_version)
    values (caller_id, 'Murid', 'free', 3)
    on conflict (id) do nothing;

    select coalesce(profile_row.learning_data, '{}'::jsonb), profile_row.learning_revision, profile_row.updated_at
      into current_payload, current_revision, current_updated_at
    from public.profiles as profile_row
    where profile_row.id = caller_id;
  end if;

  return jsonb_build_object(
    'protocolVersion', 3,
    'payload', current_payload,
    'revision', current_revision,
    'serverUpdatedAt', current_updated_at
  );
end;
$function$;

create or replace function public.get_learning_revision_v1()
  returns jsonb
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  caller_id uuid := auth.uid();
  current_revision bigint;
  current_updated_at timestamp with time zone;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;

  select profile_row.learning_revision, profile_row.updated_at
    into current_revision, current_updated_at
  from public.profiles as profile_row
  where profile_row.id = caller_id;

  return jsonb_build_object(
    'protocolVersion', 3,
    'revision', coalesce(current_revision, 0),
    'serverUpdatedAt', current_updated_at
  );
end;
$function$;

create or replace function public.prune_learning_sync_history_v1(target_account_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  backup_retention_limit constant integer := 10;
  applied_operation_retention constant interval := interval '30 days';
  conflict_operation_retention constant interval := interval '90 days';
begin
  if target_account_id is null then raise exception 'account_id_required'; end if;

  delete from public.learning_data_backups as backup_row
  using (
    select ranked_backup.id
    from (
      select history_row.id,
             row_number() over (
               partition by history_row.account_id
               order by history_row.revision desc, history_row.created_at desc, history_row.id desc
             ) as retention_rank
      from public.learning_data_backups as history_row
      where history_row.account_id = target_account_id
        and history_row.reason = 'pre-write'
    ) as ranked_backup
    where ranked_backup.retention_rank > backup_retention_limit
  ) as expired_backup
  where backup_row.id = expired_backup.id;

  delete from public.learning_sync_operations as operation_row
  where operation_row.account_id = target_account_id
    and (
      (operation_row.status = 'applied'
        and operation_row.created_at < pg_catalog.now() - applied_operation_retention)
      or
      (operation_row.status = 'conflict'
        and operation_row.created_at < pg_catalog.now() - conflict_operation_retention)
    );
end;
$function$;

create or replace function public._save_learning_data_v4_impl(
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
  incoming_payload jsonb := coalesce($1, '{}'::jsonb);
  incoming_payload_hash text;
  incoming_payload_size bigint;
  current_payload jsonb;
  current_revision bigint;
  next_revision bigint;
  current_updated_at timestamp with time zone;
  prior_account_id uuid;
  prior_status text;
  prior_unchanged boolean;
  prior_resulting_revision bigint;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if $3 is null then raise exception 'operation_id_required'; end if;
  if $2 is null or $2 < 0 then raise exception 'invalid_expected_revision'; end if;
  if coalesce($4, '') = '' then raise exception 'device_id_required'; end if;
  if jsonb_typeof(incoming_payload) <> 'object' then raise exception 'invalid_learning_payload'; end if;
  incoming_payload_size := pg_column_size(incoming_payload);
  if incoming_payload_size > 8388608 then raise exception 'learning_payload_too_large'; end if;
  if cardinality(coalesce($5, '{}'::text[])) > 100 then raise exception 'too_many_dirty_children'; end if;
  incoming_payload_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(incoming_payload::text, 'UTF8'), 'sha256'),
    'hex'
  );

  insert into public.profiles (id, display_name, access_status, learning_sync_version)
  values (caller_id, 'Murid', 'free', 3)
  on conflict (id) do nothing;

  select coalesce(profile_row.learning_data, '{}'::jsonb), profile_row.learning_revision, profile_row.updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles as profile_row where profile_row.id = caller_id for update;

  select operation_log.account_id, operation_log.status, operation_log.unchanged, operation_log.resulting_revision
    into prior_account_id, prior_status, prior_unchanged, prior_resulting_revision
  from public.learning_sync_operations as operation_log
  where operation_log.operation_id = $3;

  if prior_account_id is not null and prior_account_id <> caller_id then
    raise exception 'operation_id_account_mismatch';
  end if;
  if prior_status = 'applied' then
    return jsonb_build_object('ok', true, 'unchanged', coalesce(prior_unchanged, false),
      'duplicate', true, 'conflict', false,
      'revision', prior_resulting_revision,
      'serverUpdatedAt', case when prior_resulting_revision = current_revision then current_updated_at else null end);
  end if;
  if prior_status = 'conflict' then
    return jsonb_build_object('ok', false, 'unchanged', false,
      'duplicate', true, 'conflict', true,
      'payload', current_payload, 'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;

  if current_revision <> $2 then
    insert into public.learning_sync_operations (
      operation_id, account_id, device_id, expected_revision,
      resulting_revision, status, dirty_child_ids, submitted_payload,
      payload_hash, payload_size_bytes, unchanged
    ) values (
      $3, caller_id, left($4, 200), $2,
      current_revision, 'conflict', coalesce($5, '{}'::text[]), null,
      incoming_payload_hash, incoming_payload_size, false
    ) on conflict on constraint learning_sync_operations_pkey do nothing;
    perform public.prune_learning_sync_history_v1(caller_id);
    return jsonb_build_object('ok', false, 'unchanged', false,
      'duplicate', false, 'conflict', true,
      'payload', current_payload, 'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;

  if current_payload = incoming_payload then
    insert into public.learning_sync_operations (
      operation_id, account_id, device_id, expected_revision,
      resulting_revision, status, dirty_child_ids, submitted_payload,
      payload_hash, payload_size_bytes, unchanged
    ) values (
      $3, caller_id, left($4, 200), $2,
      current_revision, 'applied', coalesce($5, '{}'::text[]), null,
      incoming_payload_hash, incoming_payload_size, true
    ) on conflict on constraint learning_sync_operations_pkey do nothing;
    perform public.prune_learning_sync_history_v1(caller_id);
    return jsonb_build_object('ok', true, 'unchanged', true,
      'duplicate', false, 'conflict', false,
      'revision', current_revision, 'serverUpdatedAt', current_updated_at);
  end if;

  insert into public.learning_data_backups (account_id, revision, reason, payload)
  values (caller_id, current_revision, 'pre-write', current_payload)
  on conflict on constraint learning_data_backups_account_id_revision_reason_key do nothing;

  next_revision := current_revision + 1;
  update public.profiles as profile_row
  set learning_data = incoming_payload,
      learning_revision = next_revision,
      learning_sync_version = 3,
      updated_at = pg_catalog.now()
  where profile_row.id = caller_id
  returning profile_row.updated_at into current_updated_at;

  insert into public.learning_sync_operations (
    operation_id, account_id, device_id, expected_revision,
    resulting_revision, status, dirty_child_ids, submitted_payload,
    payload_hash, payload_size_bytes, unchanged
  ) values (
    $3, caller_id, left($4, 200), $2,
    next_revision, 'applied', coalesce($5, '{}'::text[]), null,
    incoming_payload_hash, incoming_payload_size, false
  ) on conflict on constraint learning_sync_operations_pkey do nothing;

  perform public.prune_learning_sync_history_v1(caller_id);

  return jsonb_build_object('ok', true, 'unchanged', false,
    'duplicate', false, 'conflict', false,
    'revision', next_revision, 'serverUpdatedAt', current_updated_at);
end;
$function$;

create or replace function public.save_learning_data_v4(
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
begin
  return public._save_learning_data_v4_impl($1, $2, $3, $4, $5);
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
  result jsonb;
  current_payload jsonb;
  current_revision bigint;
  current_updated_at timestamp with time zone;
begin
  result := public._save_learning_data_v4_impl($1, $2, $3, $4, $5);
  if coalesce((result ->> 'ok')::boolean, false) then
    select coalesce(profile_row.learning_data, '{}'::jsonb),
           profile_row.learning_revision,
           profile_row.updated_at
      into current_payload, current_revision, current_updated_at
    from public.profiles as profile_row
    where profile_row.id = caller_id;

    return result || jsonb_build_object(
      'payload', current_payload,
      'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;
  return result;
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
  normalized_event_id uuid := $1;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if normalized_event_id is null or coalesce($2, '') = '' or coalesce($3, '') = '' then
    raise exception 'invalid_learning_event_identity';
  end if;
  if pg_column_size(coalesce($5, '{}'::jsonb)) > 1048576 then raise exception 'learning_event_too_large'; end if;

  insert into public.learning_events (
    event_id, account_id, legacy_child_id, device_id, event_type, payload, client_created_at
  ) values (
    normalized_event_id, caller_id, left($2, 200), left($3, 200),
    left(coalesce($4, 'snapshot-checkpoint'), 100), coalesce($5, '{}'::jsonb), $6
  ) on conflict on constraint learning_events_pkey do nothing;

  return jsonb_build_object('ok', true, 'eventId', normalized_event_id);
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
revoke all on function public.get_learning_revision_v1() from public, anon, authenticated;
revoke all on function public.prune_learning_sync_history_v1(uuid) from public, anon, authenticated;
revoke all on function public._save_learning_data_v4_impl(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.save_learning_data_v4(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) from public, anon, authenticated;
revoke all on function public.archive_learner_profile_v1(uuid, bigint) from public, anon, authenticated;
grant execute on function public.get_learning_data_v3() to authenticated;
grant execute on function public.get_learning_revision_v1() to authenticated;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to authenticated;
grant execute on function public.save_learning_data_v4(jsonb, bigint, uuid, text, text[]) to authenticated;
grant execute on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) to authenticated;
grant execute on function public.archive_learner_profile_v1(uuid, bigint) to authenticated;
grant execute on function public.get_learning_data_v3() to postgres, service_role;
grant execute on function public.get_learning_revision_v1() to postgres, service_role;
grant execute on function public.prune_learning_sync_history_v1(uuid) to postgres, service_role;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to postgres, service_role;
grant execute on function public.save_learning_data_v4(jsonb, bigint, uuid, text, text[]) to postgres, service_role;
grant execute on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamp with time zone) to postgres, service_role;
grant execute on function public.archive_learner_profile_v1(uuid, bigint) to postgres, service_role;
