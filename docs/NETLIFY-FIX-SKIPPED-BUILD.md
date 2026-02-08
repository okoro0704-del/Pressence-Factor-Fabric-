"Implement Remote Biometric Authorization (Sentinel Push):

Login Trigger: When a user attempts to access PFF on a linked laptop, instead of a password, show a screen: 'Authorization Requested on Master Device.'

Master Device Notification: Use Firebase Cloud Messaging (FCM) or a Supabase Realtime trigger to send a high-priority prompt to the Architect's phone.

The Ritual: The prompt on the phone should say: 'Access requested from [Laptop Name]. Verify DNA to Grant.'

Biometric Handshake: Tapping the notification opens the 2-second Face/Palm scanner on the phone.

Instant Unlock: Upon a 95%+ match, the phone sends a 'Success' signal to the laptop, which automatically unlocks the Naira Treasury and Dashboard.

Failed Attempt Alert: If the scan fails or is ignored, the laptop remains locked, and an audit log entry is created: 'Unauthorized Access Blocked.'"

🏛️ THE ENTERPRISE SECURITY FLOW# Fix Netlify "Skipped" Build — Nothing Deploying

If your Netlify deploy log shows **Building: Skipped**, **Deploying: Skipped**, and only **Post-processing: Complete**, no files are being built or published. Your live site will be empty or stale.

## Why it happens

- **"Deploy without building"** is enabled, or  
- **Build command / Base directory** in Netlify UI are wrong, or  
- The site was set up for drag‑drop (no build), so Git deploys also skip the build.

## Fix in Netlify (do this first)

1. Open **[Netlify Dashboard](https://app.netlify.com)** → your site (e.g. **pff2**).
2. Go to **Site configuration** → **Build & deploy** → **Continuous deployment** → **Build settings** (or **Build** section).
3. Set:

   | Setting            | Value              | Notes |
   |--------------------|--------------------|--------|
   | **Base directory** | `web`              | Must be `web` so Netlify runs build from the Next.js app. |
   | **Build command**  | `npm run build`    | Leave empty to use repo `netlify.toml`, or set explicitly. |
   | **Publish directory** | `out`          | Must be `out` (relative to base). |
   | **Skip builds**    | **Off** / disabled | If this is on, builds and deploys will show as Skipped. |

4. Under **Build** (or **Deploy**), ensure:
   - **Deploy builds** (or equivalent) is **on**.
   - There is **no** “Deploy without building” or “Skip build” for production.

5. **Save** and trigger a new deploy:
   - **Deploys** tab → **Trigger deploy** → **Deploy site** (or push a commit to the connected branch).

## Verify

After the next deploy:

- The deploy log should show **Building** running (npm install + `npm run build`), then **Deploying** (uploading files).
- **Publish directory** should list many files (e.g. hundreds), not empty.
- Your production URL (e.g. https://pffprotocol.com) should show the latest app.

## If you deploy from your machine (CLI)

You are **not** using Netlify’s build when you run:

```bash
cd web
npm run build
npx netlify-cli deploy --prod --dir=out
```

That uploads your **local** `web/out` folder. The “Skipped” log you see is for **Git-triggered** deploys. To fix those, use the Netlify UI steps above so that **pushes to Git** run a real build and deploy.

## Repo config (already correct)

- **Root** `netlify.toml`: `base = "web"`, `command = "npm run build"`, `publish = "out"`.
- Netlify uses this when **Build command** / **Publish directory** in the UI are left at default. If the UI has “Skip builds” or wrong paths, the UI wins — so fix the UI first.
