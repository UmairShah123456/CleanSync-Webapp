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
