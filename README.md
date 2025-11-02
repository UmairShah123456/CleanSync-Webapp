## CleanSync

CleanSync keeps Airbnb and PMS turnovers synced by watching every property calendar, generating cleans at checkout, and flagging issues for your housekeeping team.

### Features

- Supabase Auth (email/password) gated dashboard, properties, and logs
- Unlimited properties per host with independent iCal feeds and manual "sync now"
- Automatic booking + clean creation, updates on date changes, and cancellation detection via `node-ical`
- Same-day check-in/out warnings added to the clean notes
- Sync history logging to monitor background jobs
- Tailwind-based UI kit (no third-party component libraries)

### Project Structure

- `app/` – Next.js App Router pages & API routes
- `components/` – Tailwind component library (ui, forms, layout primitives)
- `lib/` – Supabase clients, calendar parsing, sync helpers
- `supabase/` – SQL migrations and the `sync-ical` Edge Function source

### Local Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   ```bash
   cp .env.local.example .env.local
   # populate with your Supabase credentials
   ```

3. Run database migrations

   ```bash
   npx supabase db push
   ```

4. Start the web app
   ```bash
   npm run dev
   ```

The dashboard lives at `http://localhost:3000`. Create an account via `/register` and add properties on `/properties` to begin syncing.

### Manual Sync Endpoint

- `POST /api/sync` – syncs all of the authenticated user's properties
- `POST /api/sync { "propertyId": "uuid" }` – syncs a single property (used by the property cards)

### Deployment

CleanSync is ready for Vercel deployment. Ensure the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are defined in the hosting environment.
