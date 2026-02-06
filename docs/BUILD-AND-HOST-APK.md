# Step-by-step: Build the APK and put it on the download link

This guide gets you from zero to having the PFF PROTOCOL Android app available at your site’s **Download PFF PROTOCOL** link.

---

## Before you start

- **Node.js** 18 or newer ([nodejs.org](https://nodejs.org)).
- **Expo account** (free): sign up at [expo.dev](https://expo.dev).

---

## Step 1: Open the project and go to the mobile app

**Important:** You must run all of the following commands from inside the **`mobile`** folder. If you run `eas build` from the repo root, the build will fail in the Prebuild phase.

In a terminal (PowerShell, Command Prompt, or bash), go to your project folder, then into `mobile`:

```powershell
cd "c:\Users\Hp\Desktop\PFF - Copy"
cd mobile
```

*(On Mac/Linux, use your actual project path and `cd` as usual.)*

---

## Step 2: Install dependencies

```powershell
npm install
```

Wait until it finishes without errors.

---

## Step 3: Log in to Expo (first time only)

```powershell
npx eas-cli login
```

Enter the email and password for your Expo account. If you don’t have one, create it at [expo.dev](https://expo.dev) first.

---

## Step 4: Link the app to EAS (first time only)

```powershell
npx eas-cli init
```

- If it asks to **create a new project**, choose **Yes**.
- If it asks to **link to an existing project**, choose the one you want or create a new one.

This configures the app for EAS builds. You only need to do Steps 3 and 4 once per machine (and once per new EAS project).y

---

## Step 5: Build the Android APK

```powershell
npm run build:apk
```

Or:

```powershell
npx eas-cli build --profile preview --platform android
```

- If it asks to **generate Android credentials** (keystore), choose **Yes** so EAS can sign the APK.
- The build runs on Expo’s servers. It usually takes a few minutes.
- When it’s done, the terminal will show a **build URL**. Copy it or open it in your browser.

**If you see a Git error** (e.g. “git --help exited” or “Repair your Git installation”):

- In **PowerShell** run first:
  ```powershell
  $env:EAS_NO_VCS="1"
  ```
- Then run `npm run build:apk` again.

---

## Step 6: Download the APK from Expo

1. Open the build URL from the terminal (or go to [expo.dev](https://expo.dev) → your project → **Builds**).
2. Find the **completed** Android build and click **Download**.
3. Save the file somewhere you can find it (e.g. your Desktop or the `mobile` folder).
4. Rename the downloaded file to exactly: **`pff-protocol.apk`**

---

## Step 7: Put the APK in the website’s download folder

The site serves the app from this path:

`web\public\download\pff-protocol.apk`

**Windows (PowerShell)** — run this from the folder where `pff-protocol.apk` is (e.g. `mobile` or Downloads):

```powershell
Copy-Item pff-protocol.apk -Destination "c:\Users\Hp\Desktop\PFF - Copy\web\public\download\pff-protocol.apk"
```

*(Change the path if your project is somewhere else.)*

**Or manually:**

1. Open the `web` folder in your project.
2. Open `public`, then `download`.
3. Copy `pff-protocol.apk` into the `download` folder.

**Mac / Linux:**

```bash
cp /path/to/pff-protocol.apk /path/to/your/project/web/public/download/pff-protocol.apk
```

---

## Step 8: Deploy or run the web app

- **Local:** From the project root run your web app (e.g. `cd web` then `npm run dev`). Open the site and go to **Get PFF PROTOCOL** (or `/get-app`). On Android, **Download PFF PROTOCOL** should download the APK.
- **Deploy:** Deploy the `web` app to Netlify/Vercel/etc. as you usually do. After deployment, the same **Download PFF PROTOCOL** link will serve the APK from your live site.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | `cd` into project, then `cd mobile` |
| 2 | `npm install` |
| 3 | `npx eas-cli login` (first time only) |
| 4 | `npx eas-cli init` (first time only) |
| 5 | `npm run build:apk` |
| 6 | Download APK from Expo build page, rename to `pff-protocol.apk` |
| 7 | Copy `pff-protocol.apk` into `web/public/download/` |
| 8 | Run or deploy the web app and test the download link |

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| **“EAS project not configured”** | Run `npx eas-cli init` in the `mobile` folder, then run the build again. |
| **“Not logged in”** | Run `npx eas-cli login` and sign in. |
| **Git-related error** | In PowerShell: `$env:EAS_NO_VCS="1"`, then `npm run build:apk`. |
| **Download link gives 404** | Make sure the file is exactly `web/public/download/pff-protocol.apk` and that you’ve restarted or redeployed the web app. |
| **Prebuild failed / Unknown error in Prebuild** | You ran the build from the repo root. Run from inside `mobile`: `cd mobile` then `npm run build:apk`. |
| **Build fails on Expo** | Open the build log on expo.dev and fix any errors (e.g. config in `app.config.js` or `eas.json`). |

For more detail on the mobile build, see **`mobile/BUILD-APK.md`**.
