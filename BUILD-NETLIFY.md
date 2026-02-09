# Netlify: Make Builds Run

## "Failed to prepare repo" / Git LFS

If the build fails at **"Starting to prepare the repo for build"** with **"Failed to prepare repo"**, the repo Netlify clones likely uses **Git LFS**. Netlify does not fetch LFS objects unless you enable Large Media or remove LFS.

**1. Confirm LFS usage** (in the repo you push to Netlify):

```powershell
git check-attr filter -- .
```

Any line with `filter: lfs` means that file (or pattern) is LFS-tracked.

**2. Fix: enable Netlify Large Media** (keeps LFS, downloads assets during build):

```powershell
netlify plugins:install netlify-lm-plugin
netlify lm:install
git add .lfsconfig
git commit -m "Enable Netlify Large Media for LFS"
git push
```

Then in Netlify: **Site configuration** → **Build & deploy** → ensure the build runs after push. Redeploy.

**3. Alternative: remove LFS** (if you no longer need LFS for those assets):

On the repo that has LFS, pull real files, untrack from LFS, commit and push:

```powershell
git lfs pull
git lfs untrack "*.psd"
# or: git lfs untrack <path/to/file>
git add .gitattributes
git add .
git commit -m "Replace LFS pointers with real files"
git push
```

Redeploy on Netlify; the clone will succeed and the build can proceed.

## "Failed to prepare repo" / Wrong branch

If the build fails during **"preparing repo"** and the repo **does not** use Git LFS, Netlify is likely set to deploy a **branch that doesn’t exist** in the connected repo (e.g. Netlify set to `main` but the repo only has `master`).

**Fix in Netlify:**  
**Site settings** → **Build & deploy** → **Continuous deployment** → **Build settings** → **Branch to deploy**. Set it to a branch that actually exists:

- If the repo only has **`master`**: set **Branch to deploy** to **`master`**.
- If the repo has **`main`**: set it to **`main`**.

Then use **Trigger deploy** → **Clear cache and deploy site**.

**If you want to use `main` but the repo only has `master`:**  
Create and push `main` from your local repo (this folder has `main`; the remote may differ):

```powershell
git push origin main
```

If GitHub still only shows `master`, create `main` on the remote: e.g. on GitHub, **Settings** → **Branches** → set default branch to `main`, or create branch `main` from `master` and push.

---

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
