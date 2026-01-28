# Vitalization Screen — Standalone Frontend

**Status:** ✅ Ready for Netlify Deployment  
**Environment:** Localized Testing (Mock Service)  
**Device Target:** Redmi 15 (7,000mAh Battery)

---

## Overview

The Vitalization Screen is a standalone frontend component optimized for mobile devices, specifically the Redmi 15. It simulates the complete PFF Triple-Lock verification and VIDA CAP minting flow using mock services.

---

## Features

### ✅ Implemented

1. **PFF Triple-Lock Scan**
   - Simulates Phone UUID + Face + Fingerprint verification
   - 3-second delay (as specified)
   - Returns "Presence Verified" response

2. **50/50 Minting Split Display**
   - Shows Citizen Vault (50% share)
   - Shows National Reserve (50% share)
   - Displays total VIDA CAP minted

3. **$VIDA Balance Updates**
   - Real-time balance display after minting
   - Shows VIDA CAP and $VIDA balances
   - National Reserve total display

4. **Mobile-First Design**
   - Optimized for Redmi 15 viewport
   - Touch-friendly buttons
   - Responsive layout

5. **Modular Service Architecture**
   - Easy swap between mock and real API
   - Single import change to switch services
   - Type-safe interfaces

---

## File Structure

```
web/
├── app/
│   └── vitalization/
│       └── page.tsx              # Route page
├── components/
│   └── VitalizationScreen.tsx   # Main component
├── lib/
│   ├── mockService.ts            # Mock service (current)
│   ├── realVitalizationService.ts # Real API service (future)
│   └── vitalizationService.ts   # Service interface
└── docs/
    └── VITALIZATION-SCREEN.md    # This file
```

---

## Usage

### Access the Screen

Navigate to `/vitalization` in your browser or app.

### Flow

1. **Idle State** — User sees "Start PFF Scan" button
2. **Scanning** — HUD shows "Scanning..." (3 seconds)
3. **Minting** — HUD shows "Minting VIDA CAP..." (0.5 seconds)
4. **Success** — Displays 50/50 split results and updated balances

---

## Switching from Mock to Real API

### Current (Mock Service)

```typescript
// In VitalizationScreen.tsx
import { vitalizationService } from '@/lib/mockService';
```

### Production (Real API)

```typescript
// In VitalizationScreen.tsx
import { vitalizationService } from '@/lib/realVitalizationService';
```

**That's it!** The interface is identical, so no other code changes are needed.

---

## Environment Variables

### Mock Mode (Current)

No environment variables required. Works out of the box.

### Production Mode

Add to `.env.local` or Netlify environment:

```bash
NEXT_PUBLIC_PFF_BACKEND_URL=https://your-backend-url.com
NEXT_PUBLIC_VLT_API_URL=https://your-vlt-api-url.com  # Optional
```

---

## Netlify Deployment

### Safety Checklist

✅ **No sensitive keys** — All mock data is client-side only  
✅ **No Sovryn config** — No blockchain connections  
✅ **No backend secrets** — Mock service doesn't require API keys  
✅ **CSP compliant** — Works with existing Netlify headers  

### Build Command

```bash
npm run build
```

### Publish Directory

```
.next
```

### Environment Variables

None required for mock mode. For production, add:
- `NEXT_PUBLIC_PFF_BACKEND_URL` (optional, for real API)

---

## Mock Service Details

### PFF Scan

- **Delay:** 3 seconds (as specified)
- **Returns:** Presence Proof with PFF ID, Device ID, Handshake ID
- **Simulates:** Phone UUID + Face + Fingerprint verification

### VIDA CAP Minting

- **Amount:** 1.0 VIDA CAP per Vitalization
- **Split:** 50% Citizen Vault, 50% National Reserve
- **Transaction Hash:** Generated mock hash

### Balance Updates

- **Citizen Vault:** 0.5 VIDA CAP (50% of 1.0)
- **National Reserve:** 1000.0 VIDA CAP (mock total)
- **$VIDA:** 0.0 (no issuance yet)

---

## Testing

### Manual Testing

1. Navigate to `/vitalization`
2. Click "Start PFF Scan"
3. Wait 3 seconds for scan to complete
4. Wait 0.5 seconds for minting
5. Verify 50/50 split display
6. Verify balance updates

### Expected Results

- ✅ PFF Scan completes after 3 seconds
- ✅ VIDA CAP minting shows 0.5 / 0.5 split
- ✅ Balance updates to show 0.5 VIDA CAP
- ✅ Transaction hash displayed
- ✅ "Start New Vitalization" button works

---

## Future Enhancements

### Real API Integration

1. Update import in `VitalizationScreen.tsx`
2. Add environment variables
3. Implement WebAuthn in `realVitalizationService.ts`
4. Add Presence Token handling
5. Test with real backend

### Additional Features

- [ ] $VIDA issuance UI
- [ ] Transaction history
- [ ] QR code for PFF ID
- [ ] Offline support
- [ ] Error recovery

---

## Troubleshooting

### Mock Service Not Working

- Check browser console for errors
- Verify component is mounted
- Check network tab (should be no API calls in mock mode)

### Balance Not Updating

- Verify `mockGetVidaBalance` is called after minting
- Check state updates in React DevTools
- Verify `vidaBalance` state is set correctly

### HUD Not Showing

- Check `BiometricScanningHUD` component
- Verify `active` prop is true
- Check z-index (should be 200)

---

## Code Quality

- ✅ TypeScript strict mode
- ✅ No linter errors
- ✅ Modular architecture
- ✅ Type-safe interfaces
- ✅ Mobile-first responsive
- ✅ Accessible (ARIA labels)

---

**Ready for Netlify Deployment** 🚀

*Last Updated: January 28, 2026*
