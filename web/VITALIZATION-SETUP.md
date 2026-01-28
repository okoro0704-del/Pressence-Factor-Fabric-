# Vitalization Screen — Quick Setup Guide

## ✅ Implementation Complete

The Vitalization Screen is ready for Netlify deployment with mock services for localized testing.

---

## 🚀 Quick Start

### 1. Access the Screen

Navigate to: **`/vitalization`**

Or add a link from any page:
```tsx
<Link href="/vitalization">Vitalization Screen</Link>
```

### 2. Test the Flow

1. Click **"Start PFF Scan"**
2. Wait 3 seconds (mock scan)
3. Wait 0.5 seconds (mock minting)
4. View 50/50 split results
5. See updated $VIDA balance

---

## 📁 Files Created

### Components
- ✅ `components/VitalizationScreen.tsx` — Main screen component
- ✅ `app/vitalization/page.tsx` — Route page

### Services
- ✅ `lib/mockService.ts` — Mock service (current)
- ✅ `lib/realVitalizationService.ts` — Real API service (future)
- ✅ `lib/vitalizationService.ts` — Service interface

### Documentation
- ✅ `docs/VITALIZATION-SCREEN.md` — Full documentation
- ✅ `VITALIZATION-SETUP.md` — This file

---

## 🔄 Switching to Real API

### Step 1: Update Import

In `components/VitalizationScreen.tsx`, change:

```typescript
// FROM (Mock)
import { vitalizationService } from '@/lib/mockService';

// TO (Real)
import { vitalizationService } from '@/lib/realVitalizationService';
```

### Step 2: Add Environment Variables

In Netlify or `.env.local`:

```bash
NEXT_PUBLIC_PFF_BACKEND_URL=https://your-backend-url.com
```

### Step 3: Deploy

That's it! The interface is identical, so no other changes needed.

---

## 🎯 Features

### ✅ Implemented

- [x] PFF Scan button (3-second mock delay)
- [x] Presence verification simulation
- [x] VIDA CAP minting (50/50 split)
- [x] Balance display (VIDA CAP + $VIDA)
- [x] Success state with split breakdown
- [x] Mobile-first design (Redmi 15 optimized)
- [x] Modular service architecture
- [x] Netlify-safe (no sensitive keys)

### 🔮 Future

- [ ] Real WebAuthn integration
- [ ] $VIDA issuance UI
- [ ] Transaction history
- [ ] Offline support

---

## 📱 Mobile Optimization

### Redmi 15 Specifications
- **Battery:** 7,000mAh (optimized for field agents)
- **Viewport:** Mobile-first responsive design
- **Touch:** Large, accessible buttons
- **Performance:** Lightweight, fast loading

---

## 🔒 Netlify Safety

### ✅ Verified Safe

- ✅ No backend API keys
- ✅ No Sovryn mainnet connections
- ✅ No sensitive environment variables
- ✅ All mock data is client-side
- ✅ CSP compliant

### Build Command

```bash
npm run build
```

### Publish Directory

```
.next
```

---

## 🧪 Testing Checklist

- [x] PFF Scan completes after 3 seconds
- [x] VIDA CAP minting shows 50/50 split
- [x] Balance updates correctly
- [x] Success state displays properly
- [x] Reset button works
- [x] Error handling works
- [x] Mobile responsive
- [x] No console errors

---

## 📊 Mock Data

### VIDA CAP Minting
- **Total:** 1.0 VIDA CAP
- **Citizen Share:** 0.5 (50%)
- **National Reserve:** 0.5 (50%)

### Balance Display
- **Citizen Vault:** 0.5 VIDA CAP
- **National Reserve:** 1000.0 VIDA CAP (mock)
- **$VIDA:** 0.0 (no issuance yet)

---

## 🐛 Troubleshooting

### Screen Not Loading
- Check route: `/vitalization`
- Verify component import
- Check browser console

### Mock Service Not Working
- Verify `mockService.ts` is imported
- Check for TypeScript errors
- Verify no network calls (should be all local)

### Balance Not Updating
- Check React state updates
- Verify `getVidaBalance` is called
- Check browser DevTools

---

## 📚 Documentation

- **Full Docs:** `docs/VITALIZATION-SCREEN.md`
- **Service Interface:** `lib/vitalizationService.ts`
- **Mock Implementation:** `lib/mockService.ts`
- **Real Implementation:** `lib/realVitalizationService.ts`

---

## 🎨 Design System

### Colors
- **Background:** `#0d0d0f` (Obsidian)
- **Surface:** `#16161a` (Dark Surface)
- **Gold:** `#c9a227` (Primary)
- **Gold Bright:** `#e8c547` (Accent)
- **Text:** `#f5f5f5` (Light)
- **Muted:** `#6b6b70` (Gray)

### Typography
- **Headings:** Extrabold, tracking-tight
- **Body:** Regular, readable
- **Monospace:** Transaction hashes

---

## ✅ Ready for Deployment

The Vitalization Screen is **production-ready** for Netlify deployment with mock services. Switch to real API when ready by changing a single import.

---

**Status:** ✅ Complete  
**Last Updated:** January 28, 2026  
**Architect:** Isreal Okoro (mrfundzman)
