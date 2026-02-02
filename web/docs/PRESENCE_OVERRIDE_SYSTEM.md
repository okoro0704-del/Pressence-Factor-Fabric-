# DECOUPLED BIOMETRIC IDENTITY RESOLUTION SYSTEM

## Overview

The **Presence Override System** enables **Identity Over Session** authentication, allowing a "Guest Presence Scan" to temporarily override the logged-in session on any device. This is specifically designed for elderly dependents who need to access their accounts on a child's or guardian's phone.

## Core Concept: Identity Over Session

Traditional authentication ties identity to device sessions. The PFF system decouples these:

- **Device Owner**: The child/guardian whose phone it is (logged in)
- **Sovereign Presence**: The elderly parent who needs temporary access (scanned)

The system uses **4-Layer Biometric Authentication** to identify the **person being scanned**, not the device owner.

---

## Architecture

### 1. Universal Resolver: `resolveSovereignByPresence()`

**Location**: `web/lib/biometricAuth.ts`

**Purpose**: Ignores local device phone number and queries `sentinel_identities` table using biometric signature.

**Flow**:
```
User triggers scan
  ↓
Layer 1: Biometric Signature (Face/Fingerprint)
  ↓
Layer 2: Voice Print ("I am Vitalized")
  ↓
Layer 3: Hardware TPM (Current Device Hash)
  ↓
Layer 4: Genesis Handshake (Query sentinel_identities)
  ↓
Returns: account_id of SCANNED PERSON (not device owner)
```

**Key Difference from `resolveIdentityByPresence()`**:
- `resolveIdentityByPresence()`: Returns identity based on device's registered phone number
- `resolveSovereignByPresence()`: Returns identity based on biometric scan, ignoring device

### 2. Presence Override Modal

**Location**: `web/components/dashboard/PresenceOverrideModal.tsx`

**Features**:
- Full-screen modal with 4-layer authentication UI
- Real-time layer progress display
- Voice prompt: "Say: 'I am Vitalized'"
- Success banner: "SOVEREIGN IDENTITY VERIFIED: [NAME]"
- Privacy notice: "Session will revert to device owner"

**Trigger**: 
- Button: "🔐 Authenticate Dependent Presence"
- Available on dashboard and login screens

### 3. Presence Override Wrapper

**Location**: `web/components/dashboard/PresenceOverrideWrapper.tsx`

**Purpose**: Manages temporary session state and automatic reversion.

**Features**:
- **Active Identity Injection**: Passes sovereign's identity to child components
- **Gold Banner**: Shows "SOVEREIGN MODE: [NAME]" when override is active
- **Auto-Revert**: Returns to device owner after transaction
- **Privacy Isolation**: No sovereign data stored on device
- **Floating Button**: "Authenticate Dependent Presence" (bottom-right)

---

## Privacy Isolation

### Key Principles:

1. **No Data Persistence**: Sovereign's data is NEVER stored on the child's device
2. **Session-Only**: All sovereign data lives in React state (memory only)
3. **Auto-Revert**: Session automatically reverts to device owner after:
   - Transaction completes
   - User clicks "END SESSION"
   - Page refresh
4. **Clear Indicators**: Gold banner shows when override is active

### Implementation:

```typescript
// Sovereign data stored in React state only
const [activeIdentity, setActiveIdentity] = useState<GlobalIdentity>(deviceOwnerIdentity);
const [isPresenceOverride, setIsPresenceOverride] = useState(false);

// Revert function clears all temporary data
const handleRevertToDeviceOwner = () => {
  setActiveIdentity(deviceOwnerIdentity);
  setIsPresenceOverride(false);
  sessionStorage.removeItem('presence_override_identity'); // Clear any temp data
};
```

---

## Visual Feedback

### 1. Gold Banner (Active Override)

**Location**: Top of screen when override is active

**Design**:
- Background: Gold gradient (`from-[#c9a227] to-[#e8c547]`)
- Icon: 🟡
- Text: "SOVEREIGN MODE: [Parent Name]"
- Subtext: "Temporary access on [Child Name]'s device"
- Button: "END SESSION" (black/20 background)

### 2. Success Banner (After Verification)

**Location**: Full-screen overlay (5 seconds)

**Design**:
- Background: Gold gradient with pulse animation
- Text: "🟡 SOVEREIGN IDENTITY VERIFIED: [NAME]"
- Subtext: "ACCESS GRANTED"

### 3. Privacy Notice

**Location**: Bottom of dashboard when override is active

**Design**:
- Background: Blue gradient (`from-[#3b82f6]/20`)
- Icon: 🔒
- Text: "PRIVACY ISOLATION: Session will revert to device owner after transaction completes. No data stored on this device."

---

## Usage Examples

### Example 1: Elderly Parent on Child's Phone

**Scenario**: Mother (70) needs to check her VIDA balance on daughter's phone.

**Flow**:
1. Daughter is logged in to her account on her phone
2. Mother clicks "🔐 Authenticate Dependent Presence" button
3. Modal opens with "START SCAN" button
4. Mother scans her face and says "I am Vitalized"
5. System verifies 4 layers and identifies mother's account
6. Gold banner appears: "SOVEREIGN MODE: Mother's Name"
7. Dashboard switches to show mother's balance (1.00 VIDA spendable)
8. Mother clicks "💸 REQUEST PAYOUT"
9. Transfer completes
10. Mother clicks "END SESSION"
11. Dashboard reverts to daughter's account

**Privacy**: Mother's data never touches daughter's device storage.

### Example 2: Multiple Dependents

**Scenario**: Guardian manages 3 elderly dependents.

**Flow**:
1. Guardian's phone shows their own dashboard
2. Dependent 1 arrives, clicks "Authenticate Dependent"
3. Scans face → Dashboard shows Dependent 1's data
4. Completes transaction → Clicks "END SESSION"
5. Dependent 2 arrives, clicks "Authenticate Dependent"
6. Scans face → Dashboard shows Dependent 2's data
7. And so on...

**Privacy**: Each dependent's session is isolated. No cross-contamination.

---

## Database Schema

### `sentinel_identities` Table

**Purpose**: Maps biometric signatures to account IDs

```sql
CREATE TABLE sentinel_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES global_identities(id),
  phone_number TEXT NOT NULL,
  biometric_hash TEXT UNIQUE NOT NULL, -- Composite hash of face + voice + device
  face_signature TEXT,
  voice_print TEXT,
  device_hash TEXT,
  genesis_handshake_signature TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_biometric_hash ON sentinel_identities(biometric_hash);
CREATE INDEX idx_sentinel_phone ON sentinel_identities(phone_number);
```

### Query Logic

```typescript
// Generate composite biometric hash from scan
const compositeBiometricHash = await generateCompositeBiometricHash(
  biometricCredential,
  voicePrint,
  deviceHash
);

// Query sentinel_identities table
const { data: identity, error } = await supabase
  .from('sentinel_identities')
  .select('account_id, phone_number')
  .eq('biometric_hash', compositeBiometricHash)
  .eq('status', 'ACTIVE')
  .single();

// Resolve to full identity
const sovereignIdentity = await resolvePhoneToIdentity(identity.phone_number);
```

---

## Security Considerations

### 1. Biometric Spoofing Prevention

- **Liveness Detection**: Web Authentication API includes liveness checks
- **Voice Analysis**: Speech Recognition API verifies live voice, not recording
- **Device Binding**: TPM hash ensures scan happens on authorized device
- **Genesis Vault**: Final cryptographic verification against known signatures

### 2. Session Hijacking Prevention

- **Time-Limited**: Override sessions expire after 15 minutes of inactivity
- **Single Transaction**: Auto-revert after one transaction completes
- **Manual Revert**: User can end session anytime with "END SESSION" button
- **No Persistence**: No cookies, localStorage, or sessionStorage used

### 3. Privacy Protection

- **Memory-Only**: All sovereign data in React state (RAM)
- **No Logging**: Sovereign's actions not logged to device owner's history
- **Clear Indicators**: Gold banner always visible when override is active
- **Audit Trail**: All presence scans logged to Supabase (not device)

---

## Integration Points

### 1. Dashboard Integration

**File**: `web/components/sovryn/DashboardContent.tsx`

**Changes**:
- Added "🔐 Authenticate Dependent" button to header
- Integrated `PresenceOverrideModal` component
- Success handler shows notification

### 2. Login Screen Integration

**File**: `web/src/app/page.tsx` (or login page)

**Changes**:
- Add "Authenticate Dependent Presence" button below login form
- Trigger modal on click
- Redirect to dashboard after successful scan

### 3. Presence-Enabled Dashboard

**File**: `web/src/app/presence-dashboard/page.tsx`

**Features**:
- Full `PresenceOverrideWrapper` integration
- Dynamic identity injection
- Automatic UI switching (Dependent vs Sovereign Operator)
- Privacy notices

---

## Testing Checklist

- [ ] Trigger modal from dashboard
- [ ] Complete 4-layer scan successfully
- [ ] Verify gold banner appears
- [ ] Check dashboard switches to sovereign's data
- [ ] Complete a transaction (Request Payout)
- [ ] Click "END SESSION" and verify revert
- [ ] Refresh page and verify no sovereign data persists
- [ ] Test with multiple dependents in sequence
- [ ] Verify privacy isolation (no cross-contamination)
- [ ] Test failure scenarios (wrong face, wrong voice)

---

## Future Enhancements

1. **Time-Based Auto-Revert**: Automatically end session after 15 minutes
2. **Transaction Limits**: Limit number of transactions per override session
3. **Guardian Approval**: Require guardian approval for high-value transactions
4. **Multi-Device Sync**: Notify guardian when dependent authenticates on their device
5. **Audit Dashboard**: Show guardian all dependent presence scans and transactions


