# PFF Deployment Pipeline

Expo EAS (mobile) + Vercel (web manifesto). GitHub Actions automate tests, version bumping, EAS builds, and web deploy.

## Overview

- **Unit tests**: On every push and PR to `main` (mobile Jest).
- **Version bump**: Automated before each EAS build on `main` (`package.json`; `Info.plist` / `build.gradle` when native projects exist).
- **EAS Build**: iOS and Android (`production` profile) on merge to `main`.
- **Web deploy**: Next.js manifesto PWA deployed to Vercel on `main`.

## GitHub Secrets

**Never commit API keys, signing credentials, keystores, or certificates.** Use GitHub Secrets only.

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo auth token for EAS (e.g. from `expo login` → [expo.dev](https://expo.dev) → Account → Access tokens). |
| `EAS_PROJECT_ID` | EAS project ID (`app.config.js` / Expo dashboard). |
| `VERCEL_TOKEN` | Vercel API token ([Vercel Dashboard](https://vercel.com/account/tokens) → Create). |
| `VERCEL_ORG_ID` | Vercel team/org ID (Dashboard → Settings → General). |
| `VERCEL_PROJECT_ID` | Vercel project ID for the web manifesto app. |

### Signing (iOS / Android)

- **iOS**: Use EAS-managed credentials or register your Apple credentials in EAS. Do not commit `*.mobileprovision` or `*.p12`.
- **Android**: Use EAS-managed keystore or upload a keystore via EAS secrets. Do not commit `keystore` or `google-services.json` with secrets.

Store any custom signing assets as EAS secrets or GitHub Secrets; reference them in `eas.json` or the workflow without ever committing them.

## Deployment Targets

- **iOS**: `deploymentTarget` 16.0+ in `app.config.js` (2026 biometric/age-verification readiness). When Apple ships a 26.0 SDK, bump accordingly.
- **Android**: `compileSdkVersion` / `targetSdkVersion` 35, SHA-256 signing via EAS (Play App Signing).

## EAS Profiles

- **`production`**: Store distribution, iOS App Store / Android Play. Used by CI on `main`.
- **`preview`**: Internal distribution (ad-hoc / APK). For QA and internal testing.

## Version Bump

`mobile/scripts/version-bump.js` updates:

- `mobile/package.json` → `version`
- `mobile/ios/**/Info.plist` → `CFBundleShortVersionString`, `CFBundleVersion` (when present)
- `mobile/android/app/build.gradle` → `versionName`, `versionCode` (when present)

Set `VERSION` (e.g. `1.2.3`) and `BUILD_NUMBER` via env; CI uses `GITHUB_RUN_NUMBER` as `BUILD_NUMBER`.

## Sovereign Web (PWA)

- **App**: `web/` — Next.js 14, SSR, PWA (`@ducanh2912/next-pwa`), WebAuthn handshake, Workbox offline-first.
- **Deploy**: Vercel (or Netlify). CI runs `next build` then `vercel deploy --prebuilt --prod`.
- **Custom domain**: e.g. `vitalization.org`. Add in **Vercel** → Project → Settings → Domains (or **Netlify** → Domain management). Point your DNS A/CNAME to Vercel/Netlify. PFF must be served over **HTTPS** only; HSTS and CSP are configured in `web/vercel.json` and `web/netlify.toml`.
- Ensure the Vercel project is linked (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`); the workflow writes `.vercel/project.json` from secrets.

## Running the Workflow

1. Push or open a PR to `main` → tests run.
2. Merge to `main` → tests, then version bump + EAS build + Vercel deploy.

## Local EAS Builds

```bash
cd mobile
npm install
node scripts/ensure-expo-assets.js
npx eas build --platform all --profile production
```

Use `eas.json` `preview` profile for internal builds.
