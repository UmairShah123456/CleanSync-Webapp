# Migration Instructions

## Adding checkout_time Column to Properties Table

You need to run the migration SQL to add the `checkout_time` column to your properties table.

### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Create a new query and paste the following SQL:

```sql
-- Add checkout_time column to properties table
-- Format: HH:MM (e.g., "10:00" for 10 AM)
alter table properties
add column if not exists checkout_time text default '10:00';

-- Update existing properties to have default checkout time if null
update properties
set checkout_time = '10:00'
where checkout_time is null;
```

4. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
5. You should see "Success. No rows returned" - this means it worked!

### Option 2: Run via Supabase CLI (if you have it installed)

```bash
npx supabase db push
```

Or if you have Supabase CLI globally:

```bash
supabase db push
```

### Verification

After running the migration, you can verify it worked by running this query in the SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'checkout_time';
```

You should see `checkout_time` with type `text` and default `'10:00'`.

Once this migration is complete, you'll be able to add new properties with custom checkout times!

## Adding management_type Column to Properties Table

To track whether a property is self-managed or company-managed, add the `management_type` column.

### SQL (Supabase Dashboard or CLI)

```sql
alter table properties
add column if not exists management_type text default 'self-managed';

update properties
set management_type = 'self-managed'
where management_type is null;
```

### Verification

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_name = 'properties' and column_name = 'management_type';
```

You should see `management_type` with type `text` and default `'self-managed'`. Once added, the UI will store and display the selected management type for every property.

## Creating Cleaners & Cleaner Links Tables

The cleaners page and cleaner sharing links require dedicated tables.

```sql
create table if not exists cleaners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  cleaner_type text not null check (cleaner_type in ('individual', 'company')),
  phone text,
  notes text,
  payment_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaners_user_id_idx on cleaners (user_id);

create table if not exists cleaner_links (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid references cleaners (id) on delete cascade not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaner_links_cleaner_id_idx on cleaner_links (cleaner_id);
```

After running the migration, the cleaners UI can create and reuse unique sharing links.

## Enabling Cleaner Action Tracking

Individual cleaners can record maintenance notes and reimbursement requests from their shared schedule link. Run the following SQL to prepare the database.

```sql
alter table cleans
add column if not exists maintenance_notes text[] default array[]::text[];

create table if not exists clean_reimbursements (
  id uuid primary key default gen_random_uuid(),
  clean_id uuid references cleans (id) on delete cascade not null,
  amount numeric(10, 2) not null,
  item text not null,
  created_at timestamptz not null default now()
);

create index if not exists clean_reimbursements_clean_id_idx
  on clean_reimbursements (clean_id);
```

After running the migration you can verify the new structures with:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'cleans' and column_name = 'maintenance_notes';

select table_name
from information_schema.tables
where table_name = 'clean_reimbursements';
```

### Option 2: Supabase CLI

If you already have the Supabase CLI configured against your project, you can apply this migration (along with any pending ones) by running:

```bash
npx supabase db push
```

This will execute `supabase/migrations/0006_add_cleaner_actions.sql` on your database.
