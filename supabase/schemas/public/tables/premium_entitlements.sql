create table "public"."premium_entitlements" (
  "id" uuid primary key default gen_random_uuid(),
  "account_id" uuid not null unique references auth.users(id) on delete cascade,
  "plan" text not null default 'premium',
  "status" text not null default 'active',
  "starts_at" timestamptz not null default now(),
  "expires_at" timestamptz,
  "is_permanent" boolean not null default false,
  "source" text not null default 'admin',
  "notes" text,
  "revision" bigint not null default 1,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "updated_by" uuid references auth.users(id) on delete set null,
  constraint "premium_entitlements_plan_check" check (char_length(trim(plan)) between 1 and 80),
  constraint "premium_entitlements_status_check" check (status in ('active', 'expired', 'cancelled', 'trial', 'complimentary')),
  constraint "premium_entitlements_revision_check" check (revision > 0),
  constraint "premium_entitlements_source_check" check (char_length(trim(source)) between 1 and 120),
  constraint "premium_entitlements_notes_check" check (notes is null or char_length(notes) <= 2000),
  constraint "premium_entitlements_permanent_status_check" check (not is_permanent or status = 'complimentary'),
  constraint "premium_entitlements_expiry_presence_check" check (
    (is_permanent and status = 'complimentary' and expires_at is null)
    or (not is_permanent and expires_at is not null)
  )
);

create index premium_entitlements_status_expiry_idx
  on public.premium_entitlements (status, expires_at);

alter table "public"."premium_entitlements" enable row level security;

create policy "Users can read own premium entitlement" on "public"."premium_entitlements"
  for select to "authenticated" using ((auth.uid() = account_id));

create policy "Admins can read premium entitlements" on "public"."premium_entitlements"
  for select to "authenticated" using (public.is_current_premium_admin());

grant delete, insert, select, update on table "public"."premium_entitlements" to "postgres", "service_role";

create trigger premium_entitlements_updated_at
  before update on public.premium_entitlements
  for each row execute function public.touch_premium_entitlement_updated_at();
