# Deploy to Both URLs (Netlify App + Custom Domain)

One Netlify deploy serves **both** the Netlify app URL and your custom domain. You do **not** run two separate deploys.

---

## How it works

- **Single site, single deploy:** When you push to `main` (or trigger a deploy), Netlify builds once and publishes the same output to **every domain** attached to the site.
- **Netlify URL:** e.g. `your-site-name.netlify.app` (or the default random name).
- **Custom domain:** e.g. `app.purefreedomfoundation.org` or `yourdomain.com`.

Both URLs serve the same build.

---

## Make sure both URLs are active

### 1. Trigger a deploy

- **Option A (recommended):** Push to `main`. If the repo is connected in Netlify, a new deploy starts automatically.
- **Option B:** In Netlify Dashboard → **Site → Deploys** → **Trigger deploy** → **Deploy site**.
- **Option C:** If you use GitHub Actions with `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`, the workflow on push to `main` runs `netlify deploy --prod`.

### 2. Add your custom domain in Netlify

1. Netlify Dashboard → your **Site** → **Domain management** (or **Site configuration** → **Domain management**).
2. Click **Add custom domain** (or **Add domain alias**).
3. Enter your custom domain (e.g. `app.purefreedomfoundation.org`) and follow the DNS/SSL steps.
4. After DNS propagates and SSL is issued, the **same deploy** is served at:
   - `https://your-site-name.netlify.app`
   - `https://app.purefreedomfoundation.org` (or whatever you added)

### 3. Supabase (Auth / redirects)

In Supabase → **Authentication** → **URL configuration**:

- Add **Site URL** and **Redirect URLs** for both:
  - `https://your-site-name.netlify.app`
  - `https://your-custom-domain.com` (your actual custom domain)

So both the Netlify app URL and the custom domain work with auth.

---

## Summary

| Goal                         | Action                                                |
|-----------------------------|--------------------------------------------------------|
| Deploy to Netlify app URL   | Push to `main` or trigger deploy (same as below).     |
| Deploy to custom domain     | Same deploy; add custom domain in Netlify and DNS.    |
| Both URLs at once           | One deploy; attach custom domain in Netlify.         |

No separate “deploy to custom domain” step — one deploy, both URLs.
