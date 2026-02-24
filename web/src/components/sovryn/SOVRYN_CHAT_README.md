# 🏛️ SOVRYN AI Chat Component

## Overview

The **SOVRYN AI Chat** component is a real-time streaming chat interface that connects citizens to the SOVRYN AI companion for sovereign financial guidance, PFF Protocol knowledge, and vitalization support.

---

## ✨ Features

- ✅ **Real-time streaming responses** - Words appear as they're generated
- ✅ **Context-aware conversations** - Remembers previous messages
- ✅ **User-specific insights** - Personalized responses based on wallet/phone
- ✅ **Beautiful UI** - Deep blue & gold PFF Protocol styling
- ✅ **Mobile responsive** - Works on all devices
- ✅ **Error handling** - Graceful fallbacks when backend is unavailable
- ✅ **Abort support** - Cancel ongoing requests

---

## 🚀 Usage

### Basic Usage

```tsx
import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function MyPage() {
  return (
    <div className="h-screen">
      <SovrynChat />
    </div>
  );
}
```

### With User Context

```tsx
import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function DashboardPage() {
  const walletAddress = "0x1234...5678";
  const phoneNumber = "+2348012345678";

  return (
    <div className="h-screen">
      <SovrynChat 
        walletAddress={walletAddress}
        phoneNumber={phoneNumber}
      />
    </div>
  );
}
```

### Custom Styling

```tsx
<SovrynChat 
  walletAddress={walletAddress}
  className="max-w-4xl mx-auto shadow-2xl"
/>
```

---

## 📋 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `walletAddress` | `string` | No | User's wallet address for personalized responses |
| `phoneNumber` | `string` | No | User's phone number for fetching profile data |
| `className` | `string` | No | Additional CSS classes for styling |

---

## 🎯 AI Capabilities

The SOVRYN AI can answer questions about:

### 1. **VIDA Distribution**
- Triple-split allocation (5-5-1)
- Citizen allocation vs Treasury vs Foundation
- Economic architecture

### 2. **Vitalization**
- 4-Pillar biometric verification
- Sovereign Pulse process
- Database-driven status

### 3. **Balance Inquiries**
- VIDA CAP balance
- ngnVIDA balance
- Treasury contributions

### 4. **Treasury Mechanics**
- National Treasury reserves
- Collective sovereignty
- Block status

### 5. **Protocol Knowledge**
- DOORKEEPER PROTOCOL architecture
- Stateless frontend design
- Sentinel backend authority

---

## 🔧 Backend Integration

### Environment Variables

Set in `.env.local`:

```env
NEXT_PUBLIC_PFF_BACKEND_URL=http://localhost:4000
```

For production:

```env
NEXT_PUBLIC_PFF_BACKEND_URL=https://your-sentinel-backend.railway.app
```

### Backend Endpoint

The component calls:

```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Explain the 11 VIDA distribution",
  "userWallet": "0x1234...5678",
  "phoneNumber": "+2348012345678",
  "context": {
    "previousMessages": [
      { "role": "user", "text": "Hello" },
      { "role": "ai", "text": "Greetings, Architect..." }
    ]
  }
}
```

**Response:**
- Streaming text/plain response
- Words sent as chunks
- 30ms delay between chunks for natural typing effect

---

## 🎨 Styling

The component uses:

- **Background:** Deep black to navy gradient
- **AI Messages:** Blue gradient with border
- **User Messages:** Gold gradient
- **Input:** Dark with gold focus ring
- **Button:** Gold gradient with hover effects

All colors match the PFF Protocol design system.

---

## 📱 Example Page

A complete example page is available at:

```
web/src/app/sovryn-chat/page.tsx
```

Access it at: `http://localhost:3000/sovryn-chat`

Features:
- Info cards explaining key concepts
- Quick action buttons for common queries
- Connection status indicator
- Responsive layout

---

## 🔐 Security

- ✅ No sensitive data stored in component state
- ✅ All user context fetched from backend
- ✅ CORS enabled on backend
- ✅ Abort controller prevents memory leaks
- ✅ Error messages don't expose internal details

---

## 🚦 Error Handling

The component handles:

1. **Network errors** - Shows friendly error message
2. **Backend unavailable** - Graceful fallback
3. **Aborted requests** - Silent cleanup
4. **Empty responses** - Filters out empty AI messages

---

## 🎯 Future Enhancements

- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Conversation history persistence
- [ ] Export chat transcripts
- [ ] Integration with actual AI models (OpenAI, Claude, etc.)
- [ ] Sentiment analysis
- [ ] Proactive suggestions

---

## 📚 Related Files

- **Component:** `web/src/components/sovryn/SovrynChat.tsx`
- **Backend Route:** `backend/src/routes/chat.ts`
- **AI Service:** `backend/src/services/sovrynAI.ts`
- **Example Page:** `web/src/app/sovryn-chat/page.tsx`

---

**Built with sovereignty. Powered by SOVRYN AI. 🏛️**

