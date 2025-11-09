-- Add sync_type column to sync_logs table to distinguish between manual and automatic syncs
alter table sync_logs
add column if not exists sync_type text default 'manual' check (sync_type in ('manual', 'automatic'));

-- Update existing logs to be 'manual' (they were all manual before)
update sync_logs
set sync_type = 'manual'
where sync_type is null;

-- Make sync_type not null now that we've set defaults
alter table sync_logs
alter column sync_type set not null;

