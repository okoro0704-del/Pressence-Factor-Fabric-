# PFF PROTOCOL — Hosted app download

Place your **Android APK** here so the website can offer a direct download (no store required).

## Setup

1. Build the Android APK from the `mobile/` app (Expo/EAS):
   ```bash
   cd mobile
   eas build --profile preview --platform android
   ```
2. Download the APK from the EAS build page.
3. Rename it to **`pff-protocol.apk`** and put it in this folder:
   - `web/public/download/pff-protocol.apk`

The get-app page will then offer "Download PFF PROTOCOL" for Android users, linking to `/download/pff-protocol.apk`.

## iOS

The app is not on the App Store. The get-app page shows a short message for iOS users (use the web app or check back later). When you publish to the App Store, you can switch back to store links in `web/lib/appStoreUrls.ts` if you prefer.
