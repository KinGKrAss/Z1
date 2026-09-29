-- Z1 migration: identity-document registry
-- Security rule: never store full government document numbers or document images in the public repository.
-- Store a deterministic hash + masked display value and reference protected evidence via storage_key.

create table if not exists identity_document (
  id uuid primary key default gen_random_uuid(),
  subject_ref uuid references app_user(id) on delete set null,
  document_type text not null,
  issuer_country char(2) not null default 'DE',
  document_number_hash text not null unique,
  document_number_masked text,
  holder_name text,
  birth_name text,
  given_names text,
  date_of_birth date,
  place_of_birth text,
  nationality text,
  validity_end date,
  evidence_storage_key text,
  evidence_sha256 text,
  verification_status text not null default 'USER_PROVIDED_UNVERIFIED',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verification_status in (
    'USER_PROVIDED_UNVERIFIED',
    'PENDING_VERIFICATION',
    'VERIFIED',
    'DISCREPANCY',
    'REVOKED'
  ))
);

create index if not exists idx_identity_document_subject on identity_document(subject_ref);
create index if not exists idx_identity_document_status on identity_document(verification_status);
