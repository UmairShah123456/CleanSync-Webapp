# Cron Job Deployment Fix

## Issue

Your deployment likely failed because:

1. **Hobby Plan Limitation**: If you're on Vercel's Hobby plan, cron jobs can only run **once per day**. The schedule `0 */6 * * *` (every 6 hours) is not supported on Hobby plan.

2. **Solution Applied**: I've changed the schedule to `0 0 * * *` which runs once per day at midnight UTC. This works on all Vercel plans.

## Current Configuration

- **Schedule**: `0 0 * * *` (once per day at midnight UTC)
- **Path**: `/api/cron/sync`
- **Compatible with**: Hobby, Pro, and Enterprise plans

## If You Want Every 6 Hours

To run the sync every 6 hours, you need to:

1. **Upgrade to Vercel Pro Plan** ($20/month)
   - Pro plan allows unlimited cron invocations
   - You can schedule cron jobs as frequently as needed

2. **Update `vercel.json`** to:
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

## Plan Comparison

According to [Vercel's documentation](https://vercel.com/docs/cron-jobs/usage-and-pricing):

- **Hobby Plan**: 2 cron jobs, triggered once per day (timing not guaranteed)
- **Pro Plan**: 40 cron jobs, unlimited cron invocations
- **Enterprise**: 100 cron jobs, unlimited cron invocations

## Next Steps

1. **Deploy with the updated schedule** (once per day)
2. **Test the deployment** - it should work now
3. **If you need more frequent syncing**, upgrade to Pro plan and change the schedule back to `0 */6 * * *`

## Alternative: Use External Cron Service

If you want to stay on Hobby plan but sync more frequently, you can:

1. Use an external cron service like:
   - [cron-job.org](https://cron-job.org) (free)
   - [EasyCron](https://www.easycron.com) (free tier available)
   - [GitHub Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) (free)

2. Have them call your endpoint:
   ```bash
   curl https://your-domain.vercel.app/api/cron/sync
   ```

3. Set up the `CRON_SECRET` environment variable and pass it as:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/sync
   ```

