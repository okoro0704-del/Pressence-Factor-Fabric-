# Connect PFF to Supabase

This guide connects the PFF project to Supabase for:

- **Web app:** National Pulse realtime (handshake events, wealth ticker)
- **Backend (optional):** Use Supabase Postgres as the database instead of a local Postgres

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose organization → set **Name** (e.g. `pff`) and **Database password** (save it).
3. Pick **Region** (e.g. closest to Lagos).
4. Click **Create new project** and wait for it to be ready.

---

## 2. Get API keys and database URL

1. In the Supabase Dashboard, open **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **Project Settings** → **Database**.
4. Under **Connection string**, choose **URI** and copy the connection string (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).  
   Use this as `DATABASE_URL` for the backend (replace `[YOUR-PASSWORD]` with your database password).

---

## 3. Run the database schema in Supabase

You can either run the backend schema in the Supabase SQL Editor, or use the Supabase CLI.

### Option A: SQL Editor (recommended)

1. In Supabase Dashboard, go to **SQL Editor**.
2. Open `backend/src/db/schema.sql` from this repo and copy its full contents.
3. Paste into a new query and run it (the schema uses `IF NOT EXISTS`, so it’s safe to run once).
4. If `presence_handshakes` was created **without** a `nation` column (older schema), run:

```sql
ALTER TABLE presence_handshakes
  ADD COLUMN IF NOT EXISTS nation TEXT;
```

### Option B: Supabase CLI

From the repo root:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Then run the migration that adds `nation` if needed (see `supabase/migrations/`).

---

## 4. Enable Realtime for National Pulse

1. In Supabase Dashboard, go to **Database** → **Replication**.
2. Find **presence_handshakes** and turn **Realtime** ON (or enable it for the `public` schema and the `presence_handshakes` table in Replication settings).

This allows the web app to subscribe to new handshake rows and show them on the National Pulse map.

---

## 5. Configure the web app

1. In the repo, go to the `web` folder.
2. Copy the example env file and add your Supabase keys:

```bash
cd web
cp .env.example .env.local
```

3. Edit `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart the dev server:

```bash
npm run dev
```

The National Pulse (`/pulse`) and wealth ticker will use Supabase when these variables are set. Without them, the app falls back to mock data.

---

## 6. Configure the backend (optional)

To use Supabase Postgres as the backend database:

1. In the repo, go to the `backend` folder.
2. Copy the example env and set `DATABASE_URL` to your Supabase connection string:

```bash
cd backend
cp .env.example .env
```

3. Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Use the **Connection pooling** URI from Supabase (port **6543**) for the backend. Replace `[YOUR-PASSWORD]` with your database password.

4. Run migrations (if you use a migration runner) or ensure the schema has been applied (see step 3).
5. Start the backend:

```bash
npm run dev
```

When the backend logs a handshake (e.g. from `/vitalize/verify`), it can store an optional `nation`. If the backend uses Supabase Postgres and Realtime is enabled on `presence_handshakes`, new rows (with `nation`) will appear in real time on the National Pulse map.

---

## 7. Sending `nation` from the client

For handshakes to show on the National Pulse map with a country, the client should send `nation` when calling the backend verify endpoint.

Example request body:

```json
{
  "signedProof": { "payload": { ... }, "signature": "..." },
  "nation": "Nigeria"
}
```

The backend will store `nation` in `presence_handshakes`. If the backend uses Supabase Postgres and Realtime is on, the web app’s Supabase client will receive the new row and the map will update.

---

## 8. Summary of env vars

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web (`.env.local`) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web (`.env.local`) | Supabase anon key (realtime, wealth ticker) |
| `DATABASE_URL` | Backend (`.env`) | Supabase Postgres connection string (optional) |

---

## 9. Troubleshooting

- **Wealth ticker stays 0**  
  Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and that `presence_handshakes` exists and has rows (or that the backend is writing handshakes to Supabase).

- **National Pulse map doesn’t update**  
  Ensure Realtime is enabled for `presence_handshakes` and that new rows include a non-null `nation` when you want them to show on the map.

- **Backend can’t connect**  
  Use the connection pooling URI (port 6543), and ensure the database password in `DATABASE_URL` is correct and that the schema has been run in Supabase.

- **CSP / connection errors in browser**  
  The app’s CSP already allows `https://*.supabase.co` and `wss://*.supabase.co`. If you use a custom Supabase URL, add it to `connect-src` in `web/netlify.toml` and `web/vercel.json`.

---

**Status:** After following this guide, the project is connected to Supabase for National Pulse realtime and, optionally, for the backend database.
