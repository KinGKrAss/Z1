-- Z1 PostgreSQL canonical schema V1
-- Migration is intentionally conservative: domain source-of-truth first.

create extension if not exists pgcrypto;

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists user_role (
  user_id uuid not null references app_user(id) on delete cascade,
  role_id uuid not null references role(id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists property (
  id uuid primary key default gen_random_uuid(),
  external_ref text unique,
  title text not null,
  street text,
  postal_code text,
  city text,
  country_code char(2) not null default 'DE',
  latitude numeric(9,6),
  longitude numeric(9,6),
  property_type text,
  year_built integer,
  purchase_price numeric(18,2),
  currency char(3) not null default 'EUR',
  source text,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists unit (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references property(id) on delete cascade,
  unit_ref text,
  area_m2 numeric(12,2),
  rooms numeric(5,2),
  asking_price numeric(18,2),
  rent_monthly numeric(18,2),
  operating_cost_monthly numeric(18,2),
  status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, unit_ref)
);

create table if not exists lease (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references unit(id) on delete restrict,
  tenant_name text,
  start_date date,
  end_date date,
  rent_monthly numeric(18,2),
  deposit_amount numeric(18,2),
  currency char(3) not null default 'EUR',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists financial_account (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  account_type text,
  currency char(3) not null default 'EUR',
  external_ref text,
  created_at timestamptz not null default now()
);

create table if not exists transaction_entry (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references financial_account(id) on delete restrict,
  occurred_at timestamptz not null,
  amount numeric(20,4) not null,
  currency char(3) not null,
  category text,
  description text,
  source text,
  external_ref text,
  created_at timestamptz not null default now(),
  unique(account_id, external_ref)
);

create table if not exists document (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  mime_type text not null,
  storage_key text not null unique,
  sha256 text,
  document_type text,
  source text,
  uploaded_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table if not exists document_link (
  document_id uuid not null references document(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  primary key(document_id, entity_type, entity_id)
);

create table if not exists audit_event (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_user(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_city on property(city);
create index if not exists idx_unit_property on unit(property_id);
create index if not exists idx_lease_unit on lease(unit_id);
create index if not exists idx_transaction_account_date on transaction_entry(account_id, occurred_at desc);
create index if not exists idx_document_type on document(document_type);
create index if not exists idx_audit_entity on audit_event(entity_type, entity_id, created_at desc);
