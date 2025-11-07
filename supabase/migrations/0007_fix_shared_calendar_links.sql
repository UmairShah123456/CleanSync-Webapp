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

