-- Add checkout_time column to properties table
-- Format: HH:MM (e.g., "10:00" for 10 AM)
alter table properties
add column if not exists checkout_time text default '10:00';

-- Update existing properties to have default checkout time if null
update properties
set checkout_time = '10:00'
where checkout_time is null;

