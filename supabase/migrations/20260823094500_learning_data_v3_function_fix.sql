-- Resolve PL/pgSQL parameter/column ambiguity reported by plpgsql_check after
-- the Data Integrity v3 migration. RPC argument names remain unchanged for the
-- browser API; positional references are used inside SQL statements.

begin;

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
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_payload jsonb;
  current_revision bigint;
  next_revision bigint;
  current_updated_at timestamptz;
  prior_status text;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if $3 is null then raise exception 'operation_id_required'; end if;
  if $2 is null or $2 < 0 then raise exception 'invalid_expected_revision'; end if;
  if coalesce($4, '') = '' then raise exception 'device_id_required'; end if;
  if jsonb_typeof(coalesce($1, '{}'::jsonb)) <> 'object' then raise exception 'invalid_learning_payload'; end if;
  if pg_column_size(coalesce($1, '{}'::jsonb)) > 8388608 then raise exception 'learning_payload_too_large'; end if;
  if cardinality(coalesce($5, '{}'::text[])) > 100 then raise exception 'too_many_dirty_children'; end if;

  insert into public.profiles (id, display_name, access_status, learning_sync_version)
  values (caller_id, 'Murid', 'free', 3)
  on conflict (id) do nothing;

  select coalesce(profile_row.learning_data, '{}'::jsonb), profile_row.learning_revision, profile_row.updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles as profile_row
  where profile_row.id = caller_id
  for update;

  select operation_log.status into prior_status
  from public.learning_sync_operations as operation_log
  where operation_log.operation_id = $3
    and operation_log.account_id = caller_id;

  if prior_status = 'applied' then
    return jsonb_build_object(
      'ok', true, 'duplicate', true, 'conflict', false,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;
  if prior_status = 'conflict' then
    return jsonb_build_object(
      'ok', false, 'duplicate', true, 'conflict', true,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;

  if current_revision <> $2 then
    insert into public.learning_sync_operations (
      operation_id, account_id, device_id, expected_revision,
      resulting_revision, status, dirty_child_ids, submitted_payload
    ) values (
      $3, caller_id, left($4, 200), $2,
      current_revision, 'conflict', coalesce($5, '{}'::text[]), coalesce($1, '{}'::jsonb)
    ) on conflict on constraint learning_sync_operations_pkey do nothing;

    return jsonb_build_object(
      'ok', false, 'duplicate', false, 'conflict', true,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;

  insert into public.learning_data_backups (account_id, revision, reason, payload)
  values (caller_id, current_revision, 'pre-write', current_payload)
  on conflict on constraint learning_data_backups_account_id_revision_reason_key do nothing;

  next_revision := current_revision + 1;
  update public.profiles as profile_row
  set learning_data = coalesce($1, '{}'::jsonb),
      learning_revision = next_revision,
      learning_sync_version = 3,
      updated_at = now()
  where profile_row.id = caller_id;

  insert into public.learning_sync_operations (
    operation_id, account_id, device_id, expected_revision,
    resulting_revision, status, dirty_child_ids, submitted_payload
  ) values (
    $3, caller_id, left($4, 200), $2,
    next_revision, 'applied', coalesce($5, '{}'::text[]), coalesce($1, '{}'::jsonb)
  ) on conflict on constraint learning_sync_operations_pkey do nothing;

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'conflict', false,
    'payload', coalesce($1, '{}'::jsonb), 'revision', next_revision,
    'serverUpdatedAt', now()
  );
end;
$$;

create or replace function public.append_learning_event_v1(
  event_id uuid,
  legacy_child_id text,
  device_id text,
  event_type text,
  payload jsonb,
  client_created_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
    event_id, account_id, legacy_child_id, device_id,
    event_type, payload, client_created_at
  ) values (
    normalized_event_id, caller_id, left($2, 200), left($3, 200),
    left(coalesce($4, 'snapshot-checkpoint'), 100), coalesce($5, '{}'::jsonb), $6
  ) on conflict on constraint learning_events_pkey do nothing;

  return jsonb_build_object('ok', true, 'eventId', normalized_event_id);
end;
$$;

revoke all on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to authenticated;
grant execute on function public.append_learning_event_v1(uuid, text, text, text, jsonb, timestamptz) to authenticated;

commit;
