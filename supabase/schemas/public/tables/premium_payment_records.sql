create table "public"."premium_payment_records" (
  "id" uuid primary key default gen_random_uuid(),
  "request_id" uuid not null unique,
  "account_id" uuid not null,
  "action" text not null,
  "amount" numeric(12, 2) not null default 0,
  "currency" text not null default 'MYR',
  "payment_method" text not null default 'manual',
  "payment_reference" text,
  "payment_status" text not null default 'paid',
  "paid_at" timestamptz,
  "subscription_days_added" integer not null default 0,
  "previous_expiry" timestamptz,
  "new_expiry" timestamptz,
  "notes" text,
  "recorded_by" uuid not null,
  "created_at" timestamptz not null default now(),
  constraint "premium_payment_amount_check" check (amount >= 0),
  constraint "premium_payment_currency_check" check (currency ~ '^[A-Z]{3}$'),
  constraint "premium_payment_method_check" check (payment_method in (
    'bank_transfer', 'duitnow', 'cash', 'manual',
    'promotion', 'complimentary', 'other'
  )),
  constraint "premium_payment_status_check" check (payment_status in (
    'paid', 'pending', 'waived', 'failed', 'refunded'
  )),
  constraint "premium_payment_days_check" check (subscription_days_added >= 0),
  constraint "premium_payment_reference_check" check (payment_reference is null or char_length(payment_reference) <= 200),
  constraint "premium_payment_notes_check" check (notes is null or char_length(notes) <= 2000)
);

create index "premium_payment_account_created_idx"
  on "public"."premium_payment_records" (account_id, created_at desc);
create index "premium_payment_status_created_idx"
  on "public"."premium_payment_records" (payment_status, created_at desc);

alter table "public"."premium_payment_records" enable row level security;

create policy "Admins can read premium payment records" on "public"."premium_payment_records"
  for select to "authenticated" using (public.is_current_premium_admin());

grant insert, select, update on table "public"."premium_payment_records" to "postgres", "service_role";
