# Automated Sync Cron Job Setup

This application includes an automated sync cron job that runs every 6 hours to sync all properties for all users.

## How It Works

The cron job is configured via `vercel.json` and calls `/api/cron/sync` every 6 hours (at 00:00, 06:00, 12:00, and 18:00 UTC).

## Setup Instructions

### 1. Deploy to Vercel

Make sure your `vercel.json` file is committed and deployed:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 2. Set Environment Variables

In your Vercel project settings, ensure these environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required for cron)

**Optional (Recommended for Production):**
- `CRON_SECRET` - A secret string to secure your cron endpoint. If set, the cron job will require this secret in the Authorization header.

### 3. Configure CRON_SECRET (Recommended)

For security, set a `CRON_SECRET` environment variable in Vercel:

1. Go to your Vercel project → Settings → Environment Variables
2. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secret (e.g., `openssl rand -hex 32`)
   - **Environment**: Production (and Preview if desired)

3. Update your Vercel Cron configuration to include the secret:
   - Go to your Vercel project → Settings → Cron Jobs
   - Edit the cron job and add the Authorization header:
     ```
     Authorization: Bearer YOUR_CRON_SECRET_VALUE
     ```

### 4. Verify Cron Job is Running

After deployment, you can verify the cron job is working:

1. Check Vercel Dashboard → Functions → Cron Jobs
2. Look for execution logs
3. Check your sync_logs table in Supabase to see sync activity

## Manual Testing

You can manually test the cron endpoint:

```bash
# Without CRON_SECRET (if not set)
curl https://your-domain.vercel.app/api/cron/sync

# With CRON_SECRET
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/sync
```

## Cron Schedule

The current schedule is `0 */6 * * *` which means:
- Runs every 6 hours
- At minute 0 of hours 0, 6, 12, and 18 (UTC)

To change the schedule, edit `vercel.json` and use standard cron syntax:
- `0 */6 * * *` - Every 6 hours
- `0 */4 * * *` - Every 4 hours
- `0 0 * * *` - Once per day at midnight UTC
- `0 */12 * * *` - Every 12 hours

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Cron Jobs**: Go to your Vercel project → Settings → Cron Jobs and verify the job is configured
2. **Check Environment Variables**: Ensure all required Supabase variables are set
3. **Check Function Logs**: Go to Vercel Dashboard → Functions → View logs for `/api/cron/sync`
4. **Verify Deployment**: Make sure `vercel.json` is committed and deployed

### Errors in Sync

1. **Check Sync Logs**: Query the `sync_logs` table in Supabase to see detailed sync results
2. **Check Function Logs**: Vercel function logs will show any errors
3. **Verify iCal URLs**: Ensure all property iCal URLs are valid and accessible

### Common Issues

- **"Unauthorized" error**: Make sure `CRON_SECRET` matches between Vercel Cron config and environment variable
- **"Service role key not defined"**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
- **No properties syncing**: Check that properties exist in the database and have valid `ical_url` values

