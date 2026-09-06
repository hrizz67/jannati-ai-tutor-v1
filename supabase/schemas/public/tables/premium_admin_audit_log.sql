create table "public"."premium_admin_audit_log" (
  "id" bigint generated always as identity primary key,
  "request_id" uuid not null,
  "admin_user_id" uuid not null,
  "target_user_id" uuid not null,
  "action" text not null,
  "old_status" text not null,
  "new_status" text not null,
  "old_expiry" timestamptz,
  "new_expiry" timestamptz,
  "reason" text,
  "before_state" jsonb not null default '{}'::jsonb,
  "after_state" jsonb not null default '{}'::jsonb,
  "created_at" timestamptz not null default now(),
  constraint "premium_admin_audit_action_check" check (action in (
    'ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY',
    'START_TRIAL', 'MARK_COMPLIMENTARY', 'CANCEL_PREMIUM',
    'EXPIRE_PREMIUM', 'ADD_PAYMENT_RECORD', 'EDIT_PAYMENT_REFERENCE'
  )),
  constraint "premium_admin_audit_reason_check" check (reason is null or char_length(reason) <= 2000),
  constraint "premium_admin_audit_request_key" unique (admin_user_id, request_id)
);

create index premium_admin_audit_target_created_idx
  on public.premium_admin_audit_log (target_user_id, created_at desc);

alter table "public"."premium_admin_audit_log" enable row level security;

create policy "Admins can read premium audit log" on "public"."premium_admin_audit_log"
  for select to "authenticated" using (public.is_current_premium_admin());

grant insert, select on table "public"."premium_admin_audit_log" to "postgres", "service_role";
grant usage, select on sequence "public"."premium_admin_audit_log_id_seq" to "postgres", "service_role";
