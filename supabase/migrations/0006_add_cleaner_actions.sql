-- Add maintenance_notes column to cleans table for storing predefined notes
alter table cleans
add column if not exists maintenance_notes text[] default array[]::text[];

-- Table to track reimbursement claims submitted by cleaners per clean
create table if not exists clean_reimbursements (
  id uuid primary key default gen_random_uuid(),
  clean_id uuid references cleans (id) on delete cascade not null,
  amount numeric(10, 2) not null,
  item text not null,
  created_at timestamptz not null default now()
);

create index if not exists clean_reimbursements_clean_id_idx
  on clean_reimbursements (clean_id);
