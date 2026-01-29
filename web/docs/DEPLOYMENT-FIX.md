# Fix "Page Not Found" After Deploy

If you see **Page Not Found** after deploying, use the steps below for your platform.

---

## 1. Netlify

### Set base directory

The app lives in the **`web`** folder. Netlify must build from there.

1. Netlify Dashboard → **Site settings** → **Build & deploy** → **Build settings**
2. Set **Base directory** to: `web`
3. **Build command**: `npm run build` (or leave empty; `netlify.toml` sets it)
4. **Publish directory**: `.next` (or leave default if using the Next.js plugin)
5. **Save** and trigger a **Clear cache and deploy site**

### Install Next.js plugin (recommended)

1. **Site settings** → **Build & deploy** → **Continuous deployment** → **Build plugins**
2. Click **Add plugin** → search **Next.js**
3. Add **@netlify/plugin-nextjs**
4. Redeploy

### Check the URL

- **Home:** `https://your-site.netlify.app/` → redirects to `/manifesto`
- **Manifesto:** `https://your-site.netlify.app/manifesto`
- **Vitalization:** `https://your-site.netlify.app/vitalization`
- **Dashboard:** `https://your-site.netlify.app/dashboard`

If you still get 404 on `/`, make sure the base directory is `web` and the build completed without errors.

---

## 2. Vercel

### Set root directory

1. Vercel project → **Settings** → **General**
2. **Root Directory** → **Edit** → set to `web`
3. **Save**
4. **Redeploy** (Deployments → ⋮ → Redeploy)

### Check the URL

Same as above: `/`, `/manifesto`, `/vitalization`, `/dashboard`.

---

## 3. Running on your computer (local)

You must run the app from the **`web`** folder.

```bash
cd "PFF - Copy/web"
npm install
npm run dev
```

Then open: **http://localhost:3000**

- **http://localhost:3000/** → redirects to Manifesto  
- **http://localhost:3000/manifesto**  
- **http://localhost:3000/vitalization**  
- **http://localhost:3000/dashboard**

Do **not** run `npm run dev` from the repo root (e.g. `PFF - Copy`); there is no Next.js app at the root, so you will get errors or “Page Not Found”.

---

## 4. If you deployed the repo root by mistake

- **Netlify:** Set **Base directory** to `web` and redeploy (see §1).  
- **Vercel:** Set **Root Directory** to `web` and redeploy (see §2).  
- **Other host:** Build and run only from the `web` folder (same as local: `cd web && npm run build && npm start` or use their config to set root to `web`).

---

## 5. Custom 404 page

The app includes a custom **Not Found** page. For any unknown route you’ll see:

- “Page Not Found”
- Links to **Manifesto**, **Vitalization**, and **Dashboard**

So even if you hit a wrong URL, you can navigate back to the main pages.

---

## Quick checklist

| Check | Action |
|-------|--------|
| Base / root directory | Set to **`web`** (Netlify / Vercel) |
| Build command | `npm run build` (from `web`) |
| Local run | `cd web` then `npm run dev` |
| Correct URL | Use `/manifesto`, `/vitalization`, `/dashboard` |
| Redeploy | Clear cache and redeploy after changing base/root |

After setting the base directory to `web` and redeploying, “Page Not Found” should be resolved for both the deployed site and local run.
