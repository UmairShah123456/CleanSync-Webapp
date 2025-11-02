# Automatic Background Sync Setup

This guide explains how to set up automatic syncing every 10 minutes in the background.

## Quick Start (Recommended: Vercel)

If you're deploying on Vercel:

1. Deploy your app - The cron job is already configured in `vercel.json`!
2. The cron will automatically run every 10 minutes

**Security Note:** The endpoint automatically authenticates Vercel Cron requests using Vercel's built-in `x-vercel-cron` header (which only Vercel can send). For additional security when using external cron services, set the `CRON_SECRET` environment variable and include it in your requests.

## Overview

The app now includes a cron endpoint at `/api/cron/sync` that automatically syncs all properties from their iCal links. The endpoint is protected by a secret token to prevent unauthorized access.

## Setup Instructions

### Step 1: Set Environment Variable

Add the following environment variable to your deployment platform:

```
CRON_SECRET=your-random-secret-token-here
```

**Important**: Generate a strong, random secret token. You can use:

- A password generator
- `openssl rand -hex 32` (in terminal)
- Any secure random string generator

### Step 2: Choose Your Cron Service

#### Option A: Vercel Cron (Recommended if deploying on Vercel)

If you're deploying to Vercel, the `vercel.json` file is already configured. Simply:

1. Set the `CRON_SECRET` environment variable in your Vercel project settings
2. Deploy your app - Vercel will automatically set up the cron job
3. The sync will run every 10 minutes automatically

The cron schedule `*/10 * * * *` means "every 10 minutes".

#### Option B: External Cron Service (Works with any hosting)

If you're not on Vercel or want more control, use an external cron service:

1. **EasyCron** (https://www.easycron.com/):

   - Create an account
   - Add a new cron job
   - Set schedule: `*/10 * * * *` (every 10 minutes)
   - URL: `https://your-domain.com/api/cron/sync`
   - Method: GET
   - Headers: `Authorization: Bearer your-cron-secret-token`
   - Or use header: `X-Cron-Secret: your-cron-secret-token`

2. **cron-job.org** (https://cron-job.org/):

   - Free tier available
   - Set URL: `https://your-domain.com/api/cron/sync`
   - Set HTTP Header: `Authorization: Bearer your-cron-secret-token`
   - Set schedule: Every 10 minutes

3. **GitHub Actions** (if your code is on GitHub):
   ```yaml
   # .github/workflows/sync.yml
   name: Sync Calendar
   on:
     schedule:
       - cron: "*/10 * * * *"
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Sync
           run: |
             curl -X GET https://your-domain.com/api/cron/sync \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

#### Option C: Supabase pg_cron (Advanced - Optional)

If you want to use Supabase's built-in cron functionality directly in your database:

**Prerequisites:**

- You need access to enable extensions in your Supabase project (may require project owner access)
- Extensions `pg_cron` and `pg_net` must be enabled

**Setup Steps:**

1. Enable extensions in Supabase Dashboard:

   - Go to Database > Extensions
   - Search for and enable `pg_cron`
   - Search for and enable `pg_net`

2. Run the migration or manually schedule the job:
   - Open Supabase SQL Editor
   - Replace placeholders in `supabase/migrations/0002_setup_cron.sql` with:
     - `YOUR_API_URL`: Your Next.js app URL
     - `YOUR_CRON_SECRET`: Your CRON_SECRET value
   - Execute the SQL

**Alternative: Use Supabase Edge Function Directly**

If you prefer to use your existing Supabase Edge Function (`sync-ical`):

1. Deploy your edge function:

   ```bash
   supabase functions deploy sync-ical
   ```

2. In Supabase SQL Editor, schedule it:
   ```sql
   SELECT cron.schedule(
     'sync-calendars-edge-function',
     '*/10 * * * *',
     $$
     SELECT
       net.http_post(
         url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-ical',
         headers := jsonb_build_object(
           'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
         )
       ) AS request_id;
     $$
   );
   ```

**Note:** If extensions are not available or you encounter permission issues, use Option A or B instead.

## Testing

To test the cron endpoint manually:

```bash
curl -X GET https://your-domain.com/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret-token"
```

Or using the header:

```bash
curl -X GET https://your-domain.com/api/cron/sync \
  -H "X-Cron-Secret: your-cron-secret-token"
```

## Monitoring

The endpoint returns detailed results including:

- Summary of successful/failed syncs
- Individual property sync results
- Duration of the sync operation
- Timestamp of when the sync ran

You can check your sync logs in the `sync_logs` table in your Supabase database.

## Troubleshooting

1. **401 Unauthorized**: Check that your `CRON_SECRET` matches the token sent in the request
2. **500 Error**: Check your server logs for details
3. **No properties syncing**: Verify that properties exist in your database with valid `ical_url` values

## Security Notes

- Never commit `CRON_SECRET` to version control
- Use different secrets for different environments (dev/staging/prod)
- The endpoint only accepts GET and POST requests with proper authentication
- Consider rate limiting if exposing this endpoint publicly
