# Deploy PFF Web to Netlify

## 1. Push your code to GitHub

If you haven’t already:

```bash
cd "c:\Users\Hp\Desktop\PFF - Copy"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name.

---

## 2. Create a Netlify site from Git

1. Go to **[netlify.com](https://netlify.com)** and sign in (or create an account).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize Netlify.
4. Select the repository that contains this project (e.g. `PFF - Copy` or your repo name).
5. **Do not** click Deploy yet — set the options below first.

---

## 3. Build settings (required)

| Setting           | Value              |
|-------------------|--------------------|
| **Base directory**| `web`              |
| **Build command** | `npm run build`    |
| **Publish directory** | *(leave empty; plugin sets it)* |

- **Base directory** must be **`web`**. If you leave it blank, the build will fail or show “Page Not found”.
- Netlify will run `npm run build` inside the `web` folder (Node 18 is set in `netlify.toml`).

---

## 4. Add the Next.js plugin

1. After creating the site: **Site settings** → **Build & deploy** → **Build plugins**.
2. Click **Add plugin** → search **Next.js**.
3. Add **@netlify/plugin-nextjs**.
4. Save.

*(Your repo already has `[[plugins]]` for this in `web/netlify.toml`; linking the plugin in the UI ensures it’s used.)*

---

## 5. Environment variables (optional but recommended)

**Site settings** → **Environment variables** → **Add a variable** (or **Import from .env**).

Add these if you use Supabase and/or your backend:

| Variable                         | Description                    | Required for              |
|----------------------------------|--------------------------------|---------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL          | Pulse realtime, wealth ticker |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon/public key      | Same as above             |
| `NEXT_PUBLIC_PFF_BACKEND_URL`    | Backend API URL (e.g. `https://your-api.fly.dev`) | Vitalization, sync       |
| `PFF_BACKEND_URL`                | Same URL (server-side APIs)   | Vitalize/register API     |

You can add them **before** the first deploy or later and redeploy.

---

## 6. Deploy

1. Click **Deploy site** (or trigger a deploy from **Deploys**).
2. Wait for the build to finish (build runs in the `web` directory).
3. Open the site URL (e.g. `https://random-name-123.netlify.app`).

---

## 7. Check the app

- **Home:** `https://your-site.netlify.app/` (redirects to `/manifesto`)
- **Manifesto:** `/manifesto`
- **Pulse:** `/pulse`
- **Vitalization:** `/vitalization`
- **Dashboard:** `/dashboard`

If you see **Page Not found** on `/`, confirm **Base directory** is set to **`web`**, then **Clear cache and deploy site** again.

---

## 8. Deploy from terminal (script)

From the **web** folder run:

```powershell
.\deploy-netlify.ps1
```

The script (1) pushes the repo to Git and (2) runs `netlify deploy --prod --trigger` so the build runs on Netlify’s servers. That avoids the local **MissingBlobsEnvironmentError** (Uploading blobs) you get with `netlify deploy --build --prod` when the Blobs token isn’t set locally. Your Netlify site must be connected to the same Git repo.
