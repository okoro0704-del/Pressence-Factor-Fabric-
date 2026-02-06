# All Deployments via GitHub Actions — No Vercel

Web is deployed with **Netlify** only. Mobile builds use **EAS**. No Vercel.

---

## Summary

| Target   | Workflow file   | When it runs           | What you need |
|----------|-----------------|------------------------|----------------|
| **Netlify (web)** | `netlify.yml` | Every push to `main`   | `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (optional: Supabase) |
| **EAS (mobile)**  | `deploy.yml` → eas-build | Push to `main` **and** variable on | Variable `RUN_EAS_BUILD=true` + secrets `EXPO_TOKEN`, `EAS_PROJECT_ID` |

---

## 1. Netlify (web) — already working

- **Secrets:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (optional: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **No variable needed** — the Netlify job runs on every push to `main`.
- Full steps: see **docs/NETLIFY-AUTO-DEPLOY-OPTION-1.md**.

---

## 2. EAS Build (mobile) — optional

### 2.1 Get Expo / EAS credentials

1. Go to **[expo.dev](https://expo.dev)** → sign in.
2. **Access token:** **Account** → **Access tokens** → **Create** → name (e.g. `GitHub EAS`) → copy.  
   → Add in GitHub as secret **`EXPO_TOKEN`**.
3. **Project ID:** In your Expo project (or create one and link `mobile/` with `eas init`), open **Project settings** (or run `eas project:info` in `mobile/`). Copy the **Project ID**.  
   → Add in GitHub as secret **`EAS_PROJECT_ID`**.

### 2.2 Add GitHub secrets

In the repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret** for each:

| Secret name       | Value              |
|-------------------|--------------------|
| `EXPO_TOKEN`      | Expo access token  |
| `EAS_PROJECT_ID`  | EAS project ID     |

### 2.3 Enable the job (variable)

1. Same repo: **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.
2. **New repository variable**:  
   - Name: **`RUN_EAS_BUILD`**  
   - Value: **`true`**

The **EAS Build** job in `deploy.yml` only runs when this variable is set.

### 2.4 Test

Push to `main`. In **Actions**, the **Deploy** workflow will run **EAS Build** after the test job and produce iOS/Android builds.

---

## 3. Quick checklist

- **Web:** Netlify only. Secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` → push to `main` deploys web.
- **Mobile:** Optional. Variable `RUN_EAS_BUILD=true` + secrets `EXPO_TOKEN`, `EAS_PROJECT_ID` → push to `main` runs EAS build.

No Vercel is used anywhere.
