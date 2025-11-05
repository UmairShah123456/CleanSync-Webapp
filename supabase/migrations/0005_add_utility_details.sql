-- Add utility detail columns to properties table
alter table properties
add column if not exists access_codes text,
add column if not exists bin_locations text,
add column if not exists property_address text,
add column if not exists key_locations text;
