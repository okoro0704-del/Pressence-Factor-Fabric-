# Deploy PFF Web on Netlify

Use this when your repo is connected to Netlify and the web app lives in the **`web`** folder.

---

## 1. Build settings (required)

In **Netlify Dashboard** → your site → **Site configuration** → **Build & deploy** → **Build settings**:

| Setting | Value |
|--------|--------|
| **Base directory** | `web` |
| **Build command** | `npm run build` |
| **Publish directory** | `.next` (or leave default if using the Next.js plugin) |

Click **Save**. Without **Base directory** = `web`, you’ll get “Page Not Found”.

---

## 2. Add Supabase env vars (for National Pulse)

In **Site configuration** → **Environment variables** → **Add a variable** → **Add a single variable** (or **Add from .env**):

| Key | Value | Scopes |
|-----|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROJECT-REF.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key | All |

Get both from [Supabase](https://supabase.com) → your project → **Project Settings** → **API** (Project URL and anon public).

Then **Trigger deploy** → **Clear cache and deploy site** so the new vars are used.

---

## 3. Optional: Next.js plugin

In **Site configuration** → **Build & deploy** → **Continuous deployment** → **Build plugins**:

- **Add plugin** → search **Next.js** → add **@netlify/plugin-nextjs**.

Then redeploy.

---

## 4. Deploy

- **Automatic:** Push to your connected branch (e.g. `main`); Netlify builds from **Base directory** `web` and uses these settings.
- **Manual:** **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

---

## 5. Check the site

- **Home:** `https://YOUR-SITE.netlify.app/` → redirects to `/manifesto`
- **Manifesto:** `https://YOUR-SITE.netlify.app/manifesto`
- **Vitalization:** `https://YOUR-SITE.netlify.app/vitalization`
- **Dashboard:** `https://YOUR-SITE.netlify.app/dashboard`
- **National Pulse:** `https://YOUR-SITE.netlify.app/pulse` (realtime works when Supabase env vars are set)

---

## Quick checklist

- [ ] Base directory = `web`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (optional but needed for National Pulse)
- [ ] Clear cache and deploy after changing env vars
