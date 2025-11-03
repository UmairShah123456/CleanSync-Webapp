-- Add cleaner column to properties table
-- This stores the name of the cleaner assigned to the property
alter table properties
add column if not exists cleaner text;

