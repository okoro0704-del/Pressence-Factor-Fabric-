# Netlify deployment via GitHub Actions

The workflow `.github/workflows/netlify.yml` builds the web app and deploys to Netlify on every push to `main`.

## Required GitHub Secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret.** Add:

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify user or API token ([Netlify: Create a token](https://app.netlify.com/user/applications#personal-access-tokens)) |
| `NETLIFY_SITE_ID` | Netlify site ID (Site settings → General → Site information → Site ID) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (used at build time) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (used at build time) |

## What the workflow does

1. **Trigger:** On every `push` to `main`.
2. **Checkout** the repo.
3. **Setup Node.js** 20 with npm cache.
4. **Install** dependencies in `web/` (`npm ci` or `npm install`).
5. **Build** with `npm run build` in `web/`, using `NEXT_PUBLIC_SUPABASE_*` from secrets.
6. **Deploy** with `netlify-cli deploy --prod --dir=out` using `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

## Netlify site configuration

- **Base directory:** Set to `web` in Netlify (Site configuration → Build & deploy → Build settings).
- **Publish directory:** The workflow deploys the `out` folder (Next.js static export). Netlify.toml has `publish = "out"`; the CLI in the workflow uses `--dir=out` from the `web/` folder.

## Permissions-Policy (netlify.toml)

The Netlify config sets `Permissions-Policy: camera=(self), microphone=(self)` so the app can request camera and microphone (e.g. for PFF biometric / SOVRYN Companion) when served from your site origin.

## If the repo is not a Git repo yet

From the project root:

```bash
git init
git add .
git commit -m "Initial commit: PFF web + Netlify GitHub Actions"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

After adding the four secrets above, every push to `main` will run the workflow and deploy to Netlify.
