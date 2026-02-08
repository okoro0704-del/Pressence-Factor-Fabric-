# Netlify: Make Builds Run

If deploys show "Success" but the site never updates (build skipped or cached), do this:

## 1. Netlify Dashboard settings

1. Go to **Netlify** → your site → **Site configuration** → **Build & deploy** → **Build settings**.
2. Set:
   - **Base directory:** `web`
   - **Build command:** `npm run build`
   - **Publish directory:** `out` (relative to base = `web/out`)
   - **Production branch:** `main` (or your default branch)
3. Under **Build settings** → **Environment**, ensure **Skip builds** is **OFF** (unchecked).
4. Add env vars if needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Force a real build

- **Option A:** **Trigger deploy** → **Clear cache and deploy site**. Wait for the build to finish (check the build log).
- **Option B:** Deploy from your machine (build runs locally, then uploads):
  ```powershell
  cd "c:\Users\Hp\Desktop\PFF - Copy\web"
  npm run build
  npx netlify-cli deploy --prod --dir=out
  ```

## 3. Publish the deploy

In **Deploys**, if the latest deploy is not **Published**, open it and click **Publish deploy** so production uses it.
