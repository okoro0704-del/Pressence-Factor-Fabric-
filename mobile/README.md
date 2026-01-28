# PFF Mobile — Presence Factor Fabric

React Native app for PFF: Vitalization flow, Secure Enclave key generation, and Presence Proof signing.

## Setup

1. **Generate native projects** (required for iOS/Android):

   ```bash
   cd c:\Users\Hp\Desktop\PFF
   npx @react-native-community/cli@latest init PFFTemp --pm npm --skip-git-init
   ```

   Then copy `PFFTemp/android` and `PFFTemp/ios` into `mobile/`, merge `package.json` dependencies with this project's, and remove `PFFTemp`.

2. **Install dependencies** (includes `react-native-pager-view` for Manifesto Flow):

   ```bash
   cd mobile
   npm install
   ```

3. **iOS:** Add `NSFaceIDUsageDescription` and `NSCameraUsageDescription` in `ios/*/Info.plist` (for Face [F] / Presence Verification), then run:

   ```bash
   npx pod-install
   npm run ios
   ```

4. **Android:** Ensure `minSdkVersion` ≥ 29. Run:

   ```bash
   npm run android
   ```

## Structure

- `src/pff/` — PFF Fabric: Secure Enclave service, Handshake, nonce, deviceId, types.
- `src/vote/` — **Vote for Vitalization** portal (dark, gold/obsidian, animated).
- `src/vitalization/` — Vitalization flow UI (Welcome → Legal Identity → Device Binding → Complete).
- `src/manifesto/` — **Manifesto Flow** (primary onboarding): 8-slide pager, CMS-style config, Skip to Vitalize, Slide 6 Lagos parallax, Slide 7 Before/After slider, Slide 8 → Presence Check.
- `src/navigation/` — Stack navigator (Manifesto → Vote → Vitalization). Manifesto is initial route.
- `src/presence/` — **Presence Verification** overlay (Face [F] viewfinder, liveness HUD, seal to QR).
- `assets/images/` — Manifesto assets (e.g. Lagos skyline placeholder). See `assets/images/README.md`.

## Manifesto Flow (Primary Onboarding)

Observer to Vitalized Citizen. Eight-slide horizontal pager (`react-native-pager-view`). Content from `manifesto/manifesto.json`; set `MANIFESTO_CONFIG_URL` in `contentSource.ts` for URL-based updates. Slide 6: Lagos parallax. Slide 7: Before/After slider. **Skip to Vitalize** (top-right) and Slide 8 **Begin** open Presence Check; on success + Done, navigate to Vitalization.

## Vote for Vitalization Portal

PFF logo, tagline, live counter, Great Divergence, Terms of Vitalization, **VITALIZE MY NATION**. Opens Presence Verification; on success + Done, navigates to Vitalization. Manifesto is the default entry; Vote remains a separate route.

## Presence Verification Overlay

Triggered by "Vitalize My Nation." Face [F] circular viewfinder, camera (or placeholder in demo mode), liveness HUD with scanning pulse and feedback text ("Detecting Liveness…", "Verifying Presence…", "Hardware Anchor Secure."), and a progress ring that fills as 3D depth mapping completes. On success: haptic "thrum," golden Vitalization Seal, then morph to a QR **Presence Proof** (signed payload from PFF handshake). Error states: "Face not detected," "Move to better lighting," "Camera access needed," "Verification didn't complete," with supportive micro-copy and Retry/Close. Integrates with `performHandshake` (core PFF). "Continue without camera (demo)" runs the same flow with a placeholder for testing.

## PFF Fabric (Phone, Finger, Face)

1. **[Phone]** — `createSigningKey()` generates a unique keypair in Secure Enclave/Keymaster, bound to the device. Hardware UUID via `getDeviceId()` (react-native-device-info).
2. **[Finger/Face]** — Native biometric auth (TouchID / FaceID / Android Biometrics) gates key use. Implemented in `signPresenceProof`.
3. **Handshake** — `performHandshake()` builds a Presence Proof payload (nonce + timestamp + deviceId + keyId), triggers biometric verification, signs with the Secure Enclave key, and returns a `SignedPresenceProof` for the backend. Use this for auth; send only the signed proof.
4. **Payload** — Nonce (crypto-safe) and timestamp prevent replay. Raw biometric data never leaves the device.

## Vitalization Flow

1. **Welcome** — Intro; “Get started”.
2. **Legal Identity** — Full name, ID type, ID number (mock KYC for MVP).
3. **Device Binding** — Capabilities check → Create hardware-bound signing key.
4. **Complete** — Summary; “Continue to PFF”.

Key generation uses `react-native-biometrics` (Keychain/KeyStore). No raw biometrics leave the device.
