# Step-by-step: Auto-deploy to Netlify (Option 1 — GitHub Actions)

Follow these steps once. After that, every **push to `main`** will build and deploy the web app to Netlify.

---

## Part 1: Get your Netlify token and Site ID

### Step 1: Create a Netlify access token

1. Open **[Netlify](https://app.netlify.com)** and sign in.
2. Click your **profile picture** (top right) → **User settings** (or go to **Account**).
3. In the left sidebar, open **Applications** (under “Developer settings” or “Integrations”).
4. Under **Personal access tokens**, click **New access token** (or **Create token**).
5. Give it a name (e.g. `GitHub Actions deploy`).
6. Click **Generate token**.
7. **Copy the token** and store it somewhere safe (e.g. a password manager). You won’t see it again.  
   You’ll paste it in GitHub in Part 2 as `NETLIFY_AUTH_TOKEN`.

### Step 2: Get your Netlify Site ID

1. In Netlify, go to **Sites** and open **your PFF site** (the one you want to deploy to).
2. Go to **Site configuration** (or **Site settings**).
3. Open **General** → **Site information** (or **Build & deploy** → **Build settings**).
4. Find **API ID** or **Site ID** (a short string like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
5. **Copy it**. You’ll add it in GitHub as `NETLIFY_SITE_ID`.

---

## Part 2: Add secrets in GitHub

### Step 3: Open GitHub repo Actions secrets

1. Open your **GitHub repository** (e.g. `https://github.com/okoro0704-del/Pressence-Factor-Fabric-`).
2. Click **Settings** (top tab; you need admin/collaborator access).
3. In the left sidebar, under **Security** or **Secrets and variables**, click **Actions**.
4. You should see **Repository secrets** (and optionally **Environments**).  
   We’ll add **repository** secrets.

### Step 4: Add `NETLIFY_AUTH_TOKEN`

1. Under **Repository secrets**, click **New repository secret**.
2. **Name:** `NETLIFY_AUTH_TOKEN` (exactly, all caps).
3. **Secret:** paste the Netlify token you copied in Step 1.
4. Click **Add secret**.

### Step 5: Add `NETLIFY_SITE_ID`

1. Click **New repository secret** again.
2. **Name:** `NETLIFY_SITE_ID` (exactly, all caps).
3. **Secret:** paste the Site ID you copied in Step 2.
4. Click **Add secret**.

### Step 6 (optional): Supabase secrets

If your app uses Supabase (e.g. National Pulse, realtime):

1. **New repository secret** → Name: `NEXT_PUBLIC_SUPABASE_URL` → Value: your Supabase project URL (e.g. `https://xxxxx.supabase.co`).
2. **New repository secret** → Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: your Supabase anon/public key.

If you don’t use Supabase, you can skip this. The build may still succeed; some features may be disabled.

---

## Part 3: Confirm it works

### Step 7: Push to `main`

1. Make a small change (e.g. edit `README.md` or any file in `web/`).
2. Commit and push to the **`main`** branch:
   ```bash
   git add .
   git commit -m "chore: trigger Netlify deploy"
   git push origin main
   ```

### Step 8: Check the workflow run

1. In GitHub, open the **Actions** tab.
2. You should see a run for **“Netlify Deploy”** (or the workflow name from `.github/workflows/netlify.yml`).
3. Click the run → the **“Build and deploy to Netlify”** job should complete with a green checkmark.
4. If it fails, open the job and read the log (e.g. missing secret, build error, or Netlify API error).

### Step 9: Check Netlify

1. In **Netlify** → your site → **Deploys**.
2. A new **Production** deploy should appear (triggered by the GitHub Action).
3. Open your site URL; it should show the latest version.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | Netlify → Profile → Applications → New access token → copy token |
| 2 | Netlify → Your site → Site configuration → copy **API ID** / Site ID |
| 3 | GitHub repo → **Settings** → **Actions** (under Secrets and variables) |
| 4 | New repository secret: `NETLIFY_AUTH_TOKEN` = (token from step 1) |
| 5 | New repository secret: `NETLIFY_SITE_ID` = (Site ID from step 2) |
| 6 | (Optional) Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 7 | Push to `main` |
| 8 | GitHub → **Actions** → confirm workflow succeeds |
| 9 | Netlify → **Deploys** → confirm new production deploy |

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| **“NETLIFY_AUTH_TOKEN not set”** or deploy step fails | Confirm the secret name is exactly `NETLIFY_AUTH_TOKEN` (no space, correct caps) and that you clicked **Add secret**. |
| **“Site not found” / invalid Site ID** | Confirm `NETLIFY_SITE_ID` is the **API ID** from Netlify (Site configuration → General → Site information). |
| **Build fails in GitHub Actions** | Open the failed job log. If it’s a Next.js/build error, fix it in `web/`. If it’s “Missing environment variables”, add the optional Supabase secrets (Step 6). |
| **Workflow doesn’t run on push** | Ensure you pushed to the **`main`** branch. The workflow is set to `on: push: branches: [main]`. |
| **Other workflow (“Deploy”) failing** | The **“Deploy”** workflow runs tests + optional EAS/Vercel. The one that deploys to Netlify is **“Netlify Deploy”**. If you only use Netlify, ignore “Deploy” failures or ensure **“Netlify Deploy”** has the two Netlify secrets set and is the one that runs. |
| **Netlify site not updating** | Check **Netlify Deploy** in the Actions tab (not “Deploy”). If it’s green, open Netlify → Deploys and confirm the latest deploy is “Published”. |

Once the secrets are set and one run succeeds, every future **push to `main`** will auto-deploy to Netlify.

---

## Part 4: Push automatically after every commit (no manual “git push”)

So you don’t have to run `git push` yourself: the repo has a **post-commit hook** that pushes to `main` right after each commit. Then GitHub Actions and Netlify run as above.

**One-time setup** (from repo root):

```bash
git config core.hooksPath .githooks
```

After that:

1. You **commit** (in Cursor or terminal).
2. The hook **pushes to `main`** for you (only when you’re on the `main` branch).
3. GitHub Actions runs → Netlify deploys.

See **`scripts/enable-auto-push.md`** for details and how to turn it off.
