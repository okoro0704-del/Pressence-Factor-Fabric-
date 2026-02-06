# Build PFF PROTOCOL Android APK

The app uses **Expo Application Services (EAS)** to build the APK in the cloud. No Android Studio or local SDK required.

## Prerequisites

- **Node.js** 18+
- **Expo account** (free): [expo.dev](https://expo.dev) → Sign up

## Steps

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Log in and configure EAS (first time only)

```bash
npx eas-cli login
```

Enter your Expo email and password. Then link this app to an EAS project:

```bash
npx eas-cli init
```

Choose **Create a new project** if you don’t have one yet. This saves a project ID into `app.config.js` (or prompts to add `EAS_PROJECT_ID`).

### 3. Build the APK

```bash
npm run build:apk
```

Or:

```bash
npx eas-cli build --profile preview --platform android
```

- First time: EAS may ask to generate Android credentials (keystore). Choose **Yes** so EAS manages signing.
- Build runs on Expo’s servers (a few minutes). When it finishes, the CLI prints a link to the build page.

### 4. Download the APK

1. Open the build URL from the terminal (or go to [expo.dev](https://expo.dev) → your project → Builds).
2. Click **Download** on the completed Android build.
3. Rename the file to **`pff-protocol.apk`**.

### 5. Host it on your site

Copy the APK into the web app’s download folder:

**Windows (PowerShell):**
```powershell
Copy-Item pff-protocol.apk -Destination "..\web\public\download\pff-protocol.apk"
```

**macOS / Linux:**
```bash
cp pff-protocol.apk ../web/public/download/pff-protocol.apk
```

Then deploy your web app. Users will get the app from **Get PFF PROTOCOL** → **Download PFF PROTOCOL** on your site.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `eas: command not found` | Use `npx eas-cli build ...` (no global install needed). |
| Not logged in | Run `npx eas-cli login`. |
| **EAS project not configured** | Run `npx eas-cli init` in `mobile/`, then run the build again. |
| Git errors (e.g. `git --help` failed) | Run `$env:EAS_NO_VCS="1"` (PowerShell) or `EAS_NO_VCS=1` (bash) before the build, then `npm run build:apk`. |
| Build fails (native deps) | Check the build log on expo.dev; fix any missing config in `app.config.js` or `eas.json`. |
| Want to build locally | Use `expo prebuild` then `cd android && ./gradlew assembleRelease` (requires Android SDK). |

## Build profile

The **preview** profile in `eas.json` is set up for a distributable APK (not AAB):

- `"buildType": "apk"` — output is an APK you can host and share.
- `"distribution": "internal"` — no store upload required.

For Play Store later, use the **production** profile (builds an AAB).
