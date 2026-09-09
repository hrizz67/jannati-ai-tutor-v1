-- Permanent learning-sync storage bloat fix.
--
-- profiles.learning_data remains the authoritative full state. Normal
-- pre-write recovery snapshots are bounded to the latest 10 per account and
-- operation history becomes lightweight metadata with a realistic retry
-- window. No VACUUM FULL is run here; physical compaction remains an explicit
-- maintenance decision.

begin;

alter table public.learning_sync_operations
  alter column submitted_payload drop not null,
  alter column submitted_payload drop default;

alter table public.learning_sync_operations
  add column if not exists payload_hash text,
  add column if not exists payload_size_bytes bigint,
  add column if not exists unchanged boolean not null default false;

alter table public.learning_sync_operations
  drop constraint if exists learning_sync_operations_payload_size_bytes_check;

alter table public.learning_sync_operations
  add constraint learning_sync_operations_payload_size_bytes_check
  check (payload_size_bytes is null or payload_size_bytes >= 0);

create index if not exists learning_sync_operations_account_status_created_idx
  on public.learning_sync_operations (account_id, status, created_at desc);

comment on column public.learning_sync_operations.submitted_payload is
  'Legacy compatibility column. New v3 operations store NULL; authoritative state remains profiles.learning_data.';
comment on column public.learning_sync_operations.payload_hash is
  'SHA-256 fingerprint of the canonical JSONB text submitted to save_learning_data_v3; diagnostic only.';
comment on column public.learning_sync_operations.payload_size_bytes is
  'PostgreSQL in-row size of the submitted JSONB at request time.';
comment on column public.learning_sync_operations.unchanged is
  'True when the operation was accepted as a semantic no-op without advancing learning_revision.';

create or replace function public.prune_learning_sync_history_v1(target_account_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  backup_retention_limit constant integer := 10;
  applied_operation_retention constant interval := interval '30 days';
  conflict_operation_retention constant interval := interval '90 days';
begin
  if target_account_id is null then raise exception 'account_id_required'; end if;

  -- Special recovery reasons are intentionally excluded from this ranking.
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

  -- Successful idempotency metadata covers the normal retry/replay window.
  -- Conflict diagnostics are kept longer while remaining payload-free.
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
$$;

-- Apply bounded cleanup first so expired rows do not incur an unnecessary
-- payload rewrite/WAL cost. Special snapshots remain outside the ranking.
do $$
declare
  history_account_id uuid;
begin
  for history_account_id in
    select account_id from public.learning_data_backups
    union
    select account_id from public.learning_sync_operations
  loop
    perform public.prune_learning_sync_history_v1(history_account_id);
  end loop;
end;
$$;

-- Existing submitted payloads are not read by application or recovery code.
-- Keep metadata, fingerprint and size for retained rows, then release the full
-- JSON value. This does not modify the authoritative profile state.
update public.learning_sync_operations as operation_row
set payload_hash = coalesce(
      operation_row.payload_hash,
      pg_catalog.encode(
        extensions.digest(pg_catalog.convert_to(operation_row.submitted_payload::text, 'UTF8'), 'sha256'),
        'hex'
      )
    ),
    payload_size_bytes = coalesce(operation_row.payload_size_bytes, pg_column_size(operation_row.submitted_payload)),
    submitted_payload = null
where operation_row.submitted_payload is not null;

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
  incoming_payload jsonb := coalesce($1, '{}'::jsonb);
  incoming_payload_hash text;
  incoming_payload_size bigint;
  current_payload jsonb;
  current_revision bigint;
  next_revision bigint;
  current_updated_at timestamptz;
  prior_account_id uuid;
  prior_status text;
  prior_unchanged boolean;
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

  -- Serialize writes for this account before idempotency/revision decisions.
  select coalesce(profile_row.learning_data, '{}'::jsonb),
         profile_row.learning_revision,
         profile_row.updated_at
    into current_payload, current_revision, current_updated_at
  from public.profiles as profile_row
  where profile_row.id = caller_id
  for update;

  select operation_log.account_id, operation_log.status, operation_log.unchanged
    into prior_account_id, prior_status, prior_unchanged
  from public.learning_sync_operations as operation_log
  where operation_log.operation_id = $3;

  if prior_account_id is not null and prior_account_id <> caller_id then
    raise exception 'operation_id_account_mismatch';
  end if;
  if prior_status = 'applied' then
    return jsonb_build_object(
      'ok', true, 'unchanged', coalesce(prior_unchanged, false),
      'duplicate', true, 'conflict', false,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;
  if prior_status = 'conflict' then
    return jsonb_build_object(
      'ok', false, 'unchanged', false,
      'duplicate', true, 'conflict', true,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;

  -- Optimistic concurrency is evaluated before no-op detection. A stale
  -- writer must still reconcile with the authoritative server revision.
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
    return jsonb_build_object(
      'ok', false, 'unchanged', false,
      'duplicate', false, 'conflict', true,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;

  -- JSONB equality ignores object-key ordering. An identical canonical state
  -- creates only a lightweight idempotency row: no backup, update or revision.
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
    return jsonb_build_object(
      'ok', true, 'unchanged', true,
      'duplicate', false, 'conflict', false,
      'payload', current_payload, 'revision', current_revision,
      'serverUpdatedAt', current_updated_at
    );
  end if;

  insert into public.learning_data_backups (account_id, revision, reason, payload)
  values (caller_id, current_revision, 'pre-write', current_payload)
  on conflict (account_id, revision, reason) do nothing;

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

  -- Pruning is deliberately last in the successful backup/write/audit flow.
  perform public.prune_learning_sync_history_v1(caller_id);

  return jsonb_build_object(
    'ok', true, 'unchanged', false,
    'duplicate', false, 'conflict', false,
    'payload', incoming_payload, 'revision', next_revision,
    'serverUpdatedAt', current_updated_at
  );
end;
$$;

revoke all on function public.prune_learning_sync_history_v1(uuid) from public, anon, authenticated;
revoke all on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.prune_learning_sync_history_v1(uuid) to postgres, service_role;
grant execute on function public.save_learning_data_v3(jsonb, bigint, uuid, text, text[]) to authenticated, postgres, service_role;

commit;
