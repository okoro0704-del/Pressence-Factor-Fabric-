# Troubleshooting

## Netlify: "@netlify/plugin-nextjs" deploy error

If the deploy fails with "Deploy failed due to an error in @netlify/plugin-nextjs plugin":

1. **Get the full error**  
   Netlify Dashboard → **Deploys** → click the failed deploy → **Deploy log**. Scroll to the red error and copy the full message (it often says what went wrong).

2. **Checks that usually fix it**
   - **Base directory** is set to **`web`** (Site configuration → Build & deploy → Build settings).
   - **Node 20** is set in `web/netlify.toml` (`NODE_VERSION = "20"`). Next.js 16 works best with Node 20.
   - **Plugin in the project:** `@netlify/plugin-nextjs` is in `package.json` devDependencies so Netlify uses a known-good version.
   - **Clear cache and redeploy:** Deploys → **Trigger deploy** → **Clear cache and deploy site**.

3. **If it still fails**  
   Paste the full error from the deploy log (the line after "Error:" and any stack trace). Common causes: wrong publish directory, build output the plugin doesn’t expect, or a Node/module version mismatch.

---

## Netlify: "Publish directory is pointing to the base directory"

If you see: **"Your publish directory is pointing to the base directory of your site. This is not supported for Next.js sites."**

**Fix:** Set Publish directory to the **Next.js output folder**, not the repo root or base.

1. **Netlify Dashboard** → your site → **Site configuration** → **Build & deploy** → **Build settings**.
2. Find **Publish directory**.
3. Set it to exactly: **`.next`**  
   (Leave **Base directory** as **`web`**. Netlify will then publish `web/.next`.)
4. **Save** → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

Do **not** set Publish directory to `web` or `.` or the same as Base directory.

---

## Netlify: "Page not found" or "Page not work"

The app lives in the **`web`** folder. If Netlify builds from the repo root, it won’t find the Next.js app and you’ll get a broken or empty site.

### Fix

1. **Netlify Dashboard** → your site → **Site configuration** (or **Site settings**).
2. **Build & deploy** → **Build settings**.
3. Set **Base directory** to exactly: **`web`**
4. **Build command:** `npm run build` (or leave default).
5. **Publish directory:** leave empty (the Next.js plugin sets it).
6. Click **Save**.
7. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

Wait for the build to finish, then open your site URL again (e.g. `https://venerable-fairy-797c21.netlify.app`).

### Check the build

- **Deploys** → click the latest deploy → **Deploy log**.
- Confirm the build runs **inside** the `web` folder (you should see Next.js and “Compiled successfully”).
- If the log shows no Next.js or “package.json not found”, Base directory is still wrong.

---

## Localhost on mobile: "Refused to connect" or won’t load

`localhost` on your phone means “this phone”, not your computer. So the phone never reaches your dev server.

### Use your computer’s IP instead

1. Start the dev server on your computer:
   ```powershell
   cd "c:\Users\Hp\Desktop\PFF - Copy\web"
   npm run dev
   ```
2. In the terminal, Next.js prints something like:
   - **Local:**   http://localhost:3000
   - **Network:** http://10.115.85.124:3000
3. On your **phone**, open the **Network** URL (e.g. `http://10.115.85.124:3000`) in the browser.
4. **Phone and computer must be on the same Wi‑Fi.**

### If it still doesn’t load

- **Windows Firewall** may be blocking Node. When prompted, allow Node/JavaScript for “Private networks”.
- Or temporarily allow the dev port (e.g. 3000) in Windows Firewall for private networks.
- Try turning off VPN on both computer and phone.

### Easiest way to test on mobile

Use the **deployed Netlify URL** (e.g. `https://venerable-fairy-797c21.netlify.app`) on your phone. No firewall or IP setup needed.
