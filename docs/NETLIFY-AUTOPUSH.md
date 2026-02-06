# Netlify Auto-Deploy on Push

Pushes to `main` can deploy the web app to Netlify in two ways. Use **one** of the following.

---

## Option A: GitHub Actions (recommended)

The repo already has a workflow that builds and deploys to Netlify on every push to `main`.

**File:** `.github/workflows/netlify.yml`

**What it does:**
- Runs on every **push to `main`**
- Installs dependencies in `web/`
- Builds with `npm run build` (uses `out/` for static export)
- Deploys to Netlify production with `netlify-cli deploy --prod --dir=out`

**Required GitHub Secrets** (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify user or team API token (Account settings → Applications → Personal access tokens) |
| `NETLIFY_SITE_ID` | Site API ID (Site settings → General → Site information → API ID) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for build-time env) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (for build-time env) |

After these secrets are set, every **push to `main`** will run the workflow and deploy to Netlify.

---

## Option B: Netlify “Build on push”

1. In [Netlify](https://app.netlify.com), add the site or open the existing one.
2. **Site configuration → Build & deploy → Continuous deployment**: connect the GitHub repo.
3. Set **Base directory** to `web`.
4. Build command: `npm run build`
5. Publish directory: `out`
6. Add env vars in **Site configuration → Environment variables** (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

Then every push to the linked branch (e.g. `main`) triggers a Netlify build and deploy.

---

## Summary

- **Option A:** No Netlify UI link needed; GitHub Actions runs the build and deploys via Netlify API. Set the four secrets above.
- **Option B:** Netlify UI linked to GitHub; Netlify runs the build and deploy. No `NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID` in GitHub needed.

Using **Option A** keeps deployment in the repo and uses the same `netlify.toml` and `out/` output.
