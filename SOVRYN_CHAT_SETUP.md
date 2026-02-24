# 🏛️ SOVRYN AI Chat - Complete Setup Guide

## 📋 Overview

This guide will help you set up the SOVRYN AI Chat component in your PFF Protocol project.

---

## ✅ What's Been Added

### **Frontend Components**
1. ✅ `web/src/components/sovryn/SovrynChat.tsx` - Main chat component
2. ✅ `web/src/app/sovryn-chat/page.tsx` - Example page
3. ✅ `web/src/components/sovryn/SOVRYN_CHAT_README.md` - Documentation

### **Backend Services**
1. ✅ `backend/src/routes/chat.ts` - Chat API routes
2. ✅ `backend/src/services/sovrynAI.ts` - AI response logic
3. ✅ `backend/src/index.ts` - Updated with chat router

### **Database**
1. ✅ `supabase/migrations/20260224000000_ai_chat_logs.sql` - Chat logs table

---

## 🚀 Installation Steps

### **Step 1: Install Backend Dependencies**

```bash
cd backend
npm install cors
npm install --save-dev @types/cors
```

### **Step 2: Run Database Migration**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your PFF Protocol project
3. Navigate to: **SQL Editor**
4. Copy the contents of `supabase/migrations/20260224000000_ai_chat_logs.sql`
5. Paste and click **"Run"**

### **Step 3: Set Environment Variables**

**Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_PFF_BACKEND_URL=http://localhost:4000
```

**Backend** (`backend/.env`):
```env
FRONTEND_URL=http://localhost:3000
PORT=4000
```

### **Step 4: Start the Backend**

```bash
cd backend
npm run dev
```

You should see:
```
PFF backend listening on 4000
```

### **Step 5: Start the Frontend**

```bash
cd web
npm run dev
```

### **Step 6: Test the Chat**

Navigate to: `http://localhost:3000/sovryn-chat`

---

## 🎯 Usage Examples

### **Example 1: Standalone Chat Page**

Already created at `web/src/app/sovryn-chat/page.tsx`

Access at: `http://localhost:3000/sovryn-chat`

### **Example 2: Embed in Dashboard**

```tsx
import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function DashboardPage() {
  const walletAddress = "0x1234...5678";
  const phoneNumber = "+2348012345678";

  return (
    <div className="grid grid-cols-2 gap-8 p-8">
      {/* Left: Dashboard Stats */}
      <div>
        <h2>Your Stats</h2>
        {/* ... */}
      </div>

      {/* Right: SOVRYN AI Chat */}
      <div className="h-[600px]">
        <SovrynChat 
          walletAddress={walletAddress}
          phoneNumber={phoneNumber}
        />
      </div>
    </div>
  );
}
```

### **Example 3: Modal/Popup Chat**

```tsx
'use client';

import { useState } from 'react';
import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#ffd93d] to-[#f9ca24] text-black font-semibold px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
      >
        🏛️ Ask SOVRYN AI
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl h-[80vh] relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#ffd93d]"
            >
              ✕ Close
            </button>
            <SovrynChat />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 🧪 Testing

### **Test 1: Basic Greeting**

**User:** "Hello"

**Expected:** Greeting response from SOVRYN AI

### **Test 2: VIDA Distribution**

**User:** "Explain the 11 VIDA distribution"

**Expected:** Detailed explanation of 5-5-1 split

### **Test 3: Vitalization**

**User:** "How does vitalization work?"

**Expected:** Explanation of 4-Pillar process

### **Test 4: Balance Inquiry (Without Auth)**

**User:** "What is my balance?"

**Expected:** Message asking user to vitalize and log in

### **Test 5: Balance Inquiry (With Auth)**

**User:** "What is my balance?"

**Expected:** Personalized response with actual balance data

---

## 🔧 Troubleshooting

### **Issue 1: "Failed to fetch" Error**

**Cause:** Backend not running or wrong URL

**Solution:**
1. Check backend is running: `cd backend && npm run dev`
2. Verify `NEXT_PUBLIC_PFF_BACKEND_URL` in `web/.env.local`
3. Check CORS is enabled in `backend/src/index.ts`

### **Issue 2: CORS Error**

**Cause:** CORS not configured properly

**Solution:**
1. Install cors: `cd backend && npm install cors`
2. Check `backend/src/index.ts` has CORS middleware
3. Set `FRONTEND_URL` in `backend/.env`

### **Issue 3: No Streaming Effect**

**Cause:** Response not being streamed properly

**Solution:**
1. Check backend route uses `res.write()` not `res.json()`
2. Verify headers are set correctly in `backend/src/routes/chat.ts`
3. Check network tab shows `Transfer-Encoding: chunked`

### **Issue 4: Database Error**

**Cause:** `ai_chat_logs` table doesn't exist

**Solution:**
1. Run migration: `supabase/migrations/20260224000000_ai_chat_logs.sql`
2. Check table exists in Supabase Dashboard

---

## 📊 Analytics

View chat logs in Supabase:

```sql
SELECT 
  message,
  response,
  phone_number,
  timestamp
FROM ai_chat_logs
ORDER BY timestamp DESC
LIMIT 50;
```

---

## 🚀 Deployment

### **Frontend (Netlify)**

Already deployed! The component will work automatically.

Just set environment variable in Netlify:
```
NEXT_PUBLIC_PFF_BACKEND_URL=https://your-backend.railway.app
```

### **Backend (Railway/Render/Heroku)**

1. Deploy backend to your platform
2. Set environment variables:
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `PORT`
3. Get backend URL (e.g., `https://pff-backend.railway.app`)
4. Update frontend env variable

---

## ✅ Success Checklist

- [ ] Backend dependencies installed (`cors`)
- [ ] Database migration run (`ai_chat_logs` table exists)
- [ ] Environment variables set (frontend & backend)
- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] Can access `/sovryn-chat` page
- [ ] Chat sends messages successfully
- [ ] Streaming effect works (words appear gradually)
- [ ] Error handling works (try with backend stopped)
- [ ] User context works (with wallet/phone)

---

**🎉 You're ready to chat with SOVRYN AI!**

Navigate to: `http://localhost:3000/sovryn-chat`

