-- Delete sync logs from before 4pm on November 7th, 2025
-- This removes old log entries to clean up the database

delete from sync_logs
where run_at < '2025-11-07 16:00:00'::timestamptz;

