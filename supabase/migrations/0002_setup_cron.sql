-- Optional: Set up Supabase pg_cron to call the API endpoint
-- NOTE: This requires pg_cron and pg_net extensions to be enabled in your Supabase project
-- You may need to enable these in your Supabase dashboard under Database > Extensions

-- Enable required extensions (if not already enabled)
-- Note: You may need to enable these manually in Supabase dashboard if you don't have superuser access
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- IMPORTANT: Replace these placeholders with your actual values:
-- - YOUR_API_URL: Your Next.js app URL (e.g., https://your-app.vercel.app)
-- - YOUR_CRON_SECRET: The same CRON_SECRET value you set in your Next.js environment variables

-- Schedule a job to sync every 10 minutes
-- The cron schedule '*/10 * * * *' means: every 10 minutes
-- 
-- To set this up manually in Supabase SQL Editor:
-- 1. Replace the placeholders below with your actual values
-- 2. Run this SQL in your Supabase SQL Editor

/*
SELECT cron.schedule(
  'sync-calendars-every-10-min',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url := 'YOUR_API_URL/api/cron/sync',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET',
        'Content-Type', 'application/json'
      )
    ) AS request_id;
  $$
);
*/

-- To unschedule the job later, use:
-- SELECT cron.unschedule('sync-calendars-every-10-min');

-- Alternative: If the above doesn't work, you can use a simpler approach
-- by having Supabase call your Edge Function instead:
-- Replace 'sync-ical' with your edge function name if different

/*
SELECT cron.schedule(
  'sync-calendars-edge-function',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'YOUR_SUPABASE_URL/functions/v1/sync-ical',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY',
        'Content-Type', 'application/json'
      )
    ) AS request_id;
  $$
);
*/

-- Note: If pg_net is not available, you'll need to use an external cron service
-- to call your API endpoint instead (see CRON_SETUP.md for details)

