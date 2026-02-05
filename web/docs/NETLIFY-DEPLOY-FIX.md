# Netlify: Build not showing on live site

If your build "did not get to Netlify" or the live site shows old content, use one of these.

---

## Option 1: Deploy from your machine (recommended)

This uploads **your local build** to production so the live site matches what you just built.

1. Open a terminal in the **web** folder:
   ```powershell
   cd "c:\Users\Hp\Desktop\PFF - Copy\web"
   ```

2. Build:
   ```powershell
   npm run build
   ```

3. Deploy to production (you must be logged in: `npx netlify login` if needed):
   ```powershell
   npx netlify-cli deploy --prod --dir=out
   ```

4. Wait until you see **"Deploy is live!"** and the production URL.

5. In Netlify: **Site → Deploys**. The **latest** deploy should be "Published" and show the time you just ran the command. If an older deploy is still "Published", open the new deploy and click **"Publish deploy"** so it becomes the live one.

6. Hard refresh the site (Ctrl+Shift+R) or open it in an incognito window so the browser doesn’t show cached content.

---

## Option 2: Netlify builds from Git

If the site is **connected to GitHub**, Netlify builds when you push. If those builds don’t go live:

1. **Netlify dashboard** → your site → **Site configuration** → **Build & deploy** → **Build settings**:
   - **Base directory:** `web`
   - **Build command:** `npm run build`
   - **Publish directory:** `out` (relative to base, so `web/out`)

2. **Branch:** Under "Production branch", set to `main` (or the branch you push to).

3. Push your code:
   ```powershell
   cd "c:\Users\Hp\Desktop\PFF - Copy"
   git add -A
   git commit -m "Deploy latest"
   git push origin main
   ```

4. In Netlify → **Deploys**, wait for the new deploy to finish. If it’s not "Published", open it and click **"Publish deploy"**.

5. If builds fail, open the deploy and check the **build log** (e.g. missing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify env vars).

---

## Option 3: Clear cache and redeploy

If you think an old version is cached:

1. Netlify → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.
2. Or run a deploy from your machine (Option 1) so a fresh `out` folder is uploaded.

---

## Check that the right deploy is live

- **Netlify** → **Deploys**: the deploy marked **"Published"** is what the production URL serves.
- If your latest deploy is not published, open it and click **"Publish deploy"**.
