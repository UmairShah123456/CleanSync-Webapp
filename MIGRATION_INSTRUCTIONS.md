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

## Fixing Shared Calendar Links Issue

**Important:** This migration fixes a critical issue where adding the same calendar link to multiple accounts would cause bookings to be "stolen" from the original account. This migration allows the same booking UID to exist for different properties.

### The Problem

Previously, the `bookings` table had `uid` as the primary key, meaning each calendar event UID could only exist once in the database. When the same calendar link was added to multiple accounts:

1. The first account would create bookings with those UIDs
2. When the second account synced, it would update those bookings and change their `property_id` to the new account's property
3. This would "steal" the bookings from the original account

### The Solution

This migration changes the primary key to a composite key `(uid, property_id)`, allowing the same booking UID to exist for multiple properties. This way, each property maintains its own copy of bookings from shared calendar links.

### SQL (Supabase Dashboard or CLI)

```sql
-- Fix for shared calendar links: Allow same booking UID for different properties
-- This migration changes the bookings table primary key from just 'uid' to composite (uid, property_id)

-- Step 1: Drop the foreign key constraint first (it depends on the primary key)
-- We need to drop it before we can drop the primary key
-- Find and drop any foreign key constraint from cleans to bookings
do $$
declare
    constraint_name text;
begin
    -- Find the foreign key constraint that references bookings
    select conname into constraint_name
    from pg_constraint
    where conrelid = 'cleans'::regclass::oid
      and confrelid = 'bookings'::regclass::oid
      and contype = 'f'
    limit 1;

    if constraint_name is not null then
        execute format('alter table cleans drop constraint %I', constraint_name);
    end if;
end $$;

-- Step 2: Drop the existing primary key constraint
alter table bookings drop constraint if exists bookings_pkey;

-- Step 3: Create a new composite primary key on (uid, property_id)
alter table bookings add primary key (uid, property_id);

-- Note: PostgreSQL doesn't support foreign keys to composite primary keys directly
-- We'll keep booking_uid as a text field and rely on application logic
-- The booking_uid in cleans should be used with property_id to find the correct booking

-- Step 4: Add an index on booking_uid for performance (since we'll query by it)
create index if not exists cleans_booking_uid_idx on cleans (booking_uid);

-- Step 5: Add a unique constraint on (booking_uid, property_id) for cleans
-- This ensures one clean per booking per property
create unique index if not exists cleans_booking_uid_property_id_unique
  on cleans (booking_uid, property_id)
  where booking_uid is not null;
```

### Verification

After running the migration, verify it worked by checking the primary key:

```sql
-- Check that the primary key is now composite
SELECT
    tc.constraint_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'bookings'
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY kcu.ordinal_position;
```

You should see both `uid` and `property_id` listed as part of the primary key.

### Option 2: Supabase CLI

If you already have the Supabase CLI configured against your project, you can apply this migration (along with any pending ones) by running:

```bash
npx supabase db push
```

This will execute `supabase/migrations/0007_fix_shared_calendar_links.sql` on your database.

### What Changed in the Code

The following code changes were made to support this fix:

1. **`upsertBooking` function**: Now uses `onConflict: "uid,property_id"` instead of just `"uid"`
2. **`ensureClean` function**: Now queries cleans by both `booking_uid` AND `property_id` to ensure we get the correct clean for the property
3. **`cancelBookingAndClean` function**: Now requires `propertyId` parameter and filters by both `uid` and `property_id`

These changes ensure that each property maintains its own independent set of bookings and cleans, even when sharing the same calendar link.
