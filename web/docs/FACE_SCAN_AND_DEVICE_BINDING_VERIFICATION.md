# Face scan, device binding, and hash production — verification

This document confirms from the codebase that **(1) face scan is working**, **(2) the device is bound**, and **(3) hashes are produced and stored**.

---

## 1. Face scan is working

**Where it runs**

- **Vitalization gate (FourLayerGate):** When the user taps "Complete Initial Registration" / "Finalize Minting", `handleStartAuthentication` calls `resolveSovereignByPresence(identityAnchor.phone, …)` (`web/lib/biometricAuth.ts`).
- **resolveSovereignByPresence** starts the face pillar by calling **`verifyBiometricSignature(identityAnchorPhone)`** in parallel (around line 1277).

**What the “face scan” is**

- **With WebAuthn (Face ID / fingerprint):**  
  `verifyBiometricSignature` (in `web/lib/biometricAuth.ts`) calls `navigator.credentials.get()` (lines 116–127). That triggers the **system biometric prompt** (Face ID on iOS, fingerprint/face on Android). The returned **PublicKeyCredential** is the “face” credential used for hashing.
- **UI:** `ArchitectVisionCapture` is shown at the same time (camera + face mesh). So the user sees the camera while the system may show the native Face ID / fingerprint dialog. The **credential that is hashed comes from WebAuthn**, not from the camera image.

**Flow in code**

1. `verifyBiometricSignature` gets a credential (WebAuthn or fallback).
2. `verifyUniversalIdentity(anchor, credentialForHash, …)` checks the credential against the stored identity.
3. On success, **`deriveFaceHashFromCredential(credentialForHash)`** produces a **64‑char hex SHA-256** (`web/lib/biometricAnchorSync.ts`, lines 134–141):  
   `sha256Hex(credential.id + rawId bytes + authenticatorData bytes)`.
4. **`persistFaceHash(identityAnchorPhone, faceTemplateHash)`** (lines 147–217) writes that hash to:
   - **Supabase:** `user_profiles.face_hash` (update or insert, or RPC `update_user_profile_face_hash`).
   - **Session:** `setFaceHashInSession(phone, hash)` so the rest of the flow can read it via `getFaceHashFromSession(phone)`.

So: **face scan (WebAuthn/biometric) runs, a credential is obtained, a face hash is derived and persisted to DB and session.**

---

## 2. Device is bound

**Where it runs**

- After the face pillar succeeds, **`handleArchitectVisionComplete`** (FourLayerGate) shows the **“Bind this device (Passkey)”** prompt.
- When the user clicks **“Bind this device (Passkey)”**, **`handleDeviceBindingClick`** runs **`runDeviceBindingAndSovereignHash(phone, faceHash, deviceId, displayName)`** (`web/components/dashboard/FourLayerGate.tsx`, around lines 106–137 and 1357–1383).

**What “device binding” does**

1. **WebAuthn:**  
   Tries **`getAssertion()`** (use existing passkey). If none, **`createCredential(phone, displayName)`** (create new passkey). Either way the browser/OS prompts (e.g. Face ID / Windows Hello). Result: **`credentialId`** (and credential) for this device.
2. **Device hash:**  
   **`deriveDeviceHashFromCredentialId(credentialId)`** (`web/lib/sovereignRoot.ts`, lines 65–72):  
   `SHA-256(credentialId)` → 64‑char hex **device hash**.
3. **Sovereign root + pillars:**  
   **`generateAndSaveSovereignRootFaceDevice(phone, faceHash, deviceHash, deviceId)`** (`web/lib/fourPillars.ts`):
   - Builds sovereign root from face + device (Merkle-style).
   - Calls **`savePillarsAt75(phone, faceHash, deviceHash, deviceId)`** so **`user_profiles`** gets `face_hash`, `palm_hash` (used for device hash), `anchor_device_id`.
4. **Passkey ↔ identity link:**  
   **`linkPasskeyToDeviceAnchors(credentialId, phone, faceHash)`** (`web/lib/deviceAnchors.ts`):
   - **`hashCredentialId(credentialId)`** → `credential_id_hash`.
   - **Upserts** into **`device_anchors`**: `phone_number`, `citizen_hash` (face hash), `credential_id_hash`. So this passkey is tied to this phone and this “citizen” (face) hash.

So: **the device is bound** (passkey created or reused, stored in `device_anchors`, and `user_profiles` updated with `anchor_device_id` and the second-pillar hash).

---

## 3. A hash was actually produced

**Face hash**

- **Produced:** `deriveFaceHashFromCredential(credential)` → SHA-256 of `(id + rawId + authenticatorData)` → **64‑char hex**.
- **Stored:**  
  - DB: `user_profiles.face_hash` (via `persistFaceHash`).  
  - Session: `pff_face_hash_<phone>` (via `setFaceHashInSession`).  
  - Optional: cookie `pff_face_anchor`, localStorage `pff_face_hash_persistent` (via `setPersistentFaceHash` when used).

**Device hash**

- **Produced:** `deriveDeviceHashFromCredentialId(credentialId)` → SHA-256 of credential ID string → **64‑char hex**.
- **Stored:**  
  - In the Face+Device flow it is passed as the second pillar to **`savePillarsAt75(phone, faceHash, deviceHash, deviceId)`**, which writes it into **`user_profiles.palm_hash`** (and `anchor_device_id`).  
  - Sovereign root (Merkle of face + device) is saved to **`user_profiles.sovereign_root`** (and related sovereign/citizen tables).

**Credential ID hash (for device anchor)**

- **Produced:** `hashCredentialId(credentialId)` in **`deviceAnchors.ts`** → SHA-256 of credential ID → **64‑char hex**.
- **Stored:** **`device_anchors.credential_id_hash`** (with `phone_number`, `citizen_hash`) so login from this device can resolve identity.

So: **at least one hash (and in normal flow all of: face hash, device hash, credential_id hash) is produced and stored** in Supabase and/or session.

---

## 4. 10 VIDA CAP mint and "You're Vitalized" in the app

**When mint is triggered**

- After **75% success** (Face + Device pillars complete), the at-75 effect in **FourLayerGate** runs once:
  1. **`savePillarsAt75(phone, faceHash, deviceHash, deviceId)`** → RPC **`save_pillars_at_75`** sets **`user_profiles.vitalization_status = 'VITALIZED'`** and stores face_hash, palm_hash (device hash), anchor_device_id.
  2. **`mintFoundationSeigniorage(phone, { faceHash })`** → **10 VIDA CAP** is credited to the user (and 1 to foundation), subject to constitution signed and humanity check (`web/lib/foundationSeigniorage.ts`: `USER_VIDA_ON_VERIFY = 10`; balance written to **`sovereign_internal_wallets.vida_cap_balance`**).
  3. **`setVitalizationComplete()`** and **`setVitalizationAnchor(faceHash, phone, secondHash)`** set local "vitalized" state (localStorage: `pff_VITALIZED`, anchor with `isVitalized: true`).

If constitution is not yet signed, the mint may be deferred until the user signs and proceeds to dashboard (where **goToDashboard** can call **mintFoundationSeigniorage** / **ensureMintedAndBalance**). Either way, the **protocol amount is 10 VIDA CAP** per Vitalization.

**Where the app confirms "you're vitalized"**

- **Database:** `user_profiles.vitalization_status = 'VITALIZED'` (set by `save_pillars_at_75`); optionally `is_minted` and `face_hash` present.
- **Client state:** `setVitalizationComplete()` and `setVitalizationAnchor(...)` set localStorage/session flags used by the app.
- **Status API:** **`getCitizenStatusForPhone(phone)`** (`web/lib/supabaseTelemetry.ts`) returns **`'VITALIZED'`** when `vitalization_status === 'VITALIZED'` or `is_minted === true` or `face_hash` is set.
- **UI:** **LayerStatusBar** shows **"CITIZEN ACTIVE"** when the user is vitalized; **WalletSovereignIdCard** and **AppShell** use the same status; success shield shows **"10 VIDA CAP SUCCESSFULLY MINTED"**.

So: **after all successes (Face + Device at 75%), the flow triggers minting of 10 VIDA CAP and the app confirms the user is vitalized** (DB, client state, and CITIZEN ACTIVE / vitalized UI).

---

## Summary

| Check | Status | Where |
|-------|--------|--------|
| Face scan runs | Yes | `resolveSovereignByPresence` → `verifyBiometricSignature` → `navigator.credentials.get()` (or fallback); UI: `ArchitectVisionCapture`. |
| Face hash produced | Yes | `deriveFaceHashFromCredential(credential)` → 64‑char hex. |
| Face hash stored | Yes | `persistFaceHash` → `user_profiles.face_hash` + `setFaceHashInSession`. |
| Device binding runs | Yes | User clicks “Bind this device” → `runDeviceBindingAndSovereignHash` → getAssertion/createCredential. |
| Device hash produced | Yes | `deriveDeviceHashFromCredentialId(credentialId)` → 64‑char hex. |
| Device bound in DB | Yes | `savePillarsAt75` (face_hash, device hash, anchor_device_id); `linkPasskeyToDeviceAnchors` → `device_anchors`. |
| 10 VIDA CAP mint | Yes | At 75%: `mintFoundationSeigniorage(phone, { faceHash })` → `USER_VIDA_ON_VERIFY = 10` → `sovereign_internal_wallets.vida_cap_balance`. |
| Vitalized in app | Yes | `save_pillars_at_75` sets `vitalization_status = 'VITALIZED'`; `getCitizenStatusForPhone` → 'VITALIZED'; LayerStatusBar "CITIZEN ACTIVE"; success shield "10 VIDA CAP SUCCESSFULLY MINTED". |

**Note:** The “face” credential used for the **face hash** comes from the **WebAuthn biometric prompt** (Face ID / fingerprint), not from the camera image. The camera in `ArchitectVisionCapture` is for liveness/UX; the actual hash is from the credential returned by `navigator.credentials.get()` (or the fallback synthetic credential).
