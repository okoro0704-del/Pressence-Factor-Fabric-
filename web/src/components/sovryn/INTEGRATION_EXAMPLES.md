# 🏛️ SOVRYN AI Chat - Integration Examples

## 📋 Overview

This guide shows you how to integrate the SOVRYN AI Chat component into different parts of your PFF Protocol application.

---

## 🎯 Integration Patterns

### **Pattern 1: Floating Chat Button (Recommended)**

Add a floating chat button that opens a modal with the chat interface.

**File:** `web/src/components/sovryn/FloatingChatButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { SovrynChat } from './SovrynChat';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#ffd93d] to-[#f9ca24] text-black font-bold px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 flex items-center gap-2"
      >
        <span className="text-2xl">🏛️</span>
        <span className="hidden md:inline">Ask SOVRYN AI</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-5xl h-[85vh] relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#ffd93d] text-xl font-bold transition-colors"
            >
              ✕ Close
            </button>
            
            {/* Chat Component */}
            <SovrynChat />
          </div>
        </div>
      )}
    </>
  );
}
```

**Usage in Layout:**

```tsx
// web/src/app/layout.tsx
import { FloatingChatButton } from '@/components/sovryn/FloatingChatButton';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <FloatingChatButton />
      </body>
    </html>
  );
}
```

---

### **Pattern 2: Dashboard Sidebar**

Add chat as a sidebar in your dashboard.

**File:** `web/src/app/dashboard/page.tsx`

```tsx
'use client';

import { SovrynChat } from '@/components/sovryn/SovrynChat';
import { useState } from 'react';

export default function DashboardPage() {
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Main Dashboard Content */}
      <div className={`flex-1 p-8 transition-all ${showChat ? 'mr-96' : ''}`}>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {/* Your dashboard content */}
        <div className="grid grid-cols-2 gap-6">
          {/* Stats cards, charts, etc. */}
        </div>

        {/* Toggle Chat Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-8 right-8 bg-[#ffd93d] text-black px-4 py-2 rounded-lg"
        >
          {showChat ? 'Hide' : 'Show'} SOVRYN AI
        </button>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="fixed right-0 top-0 h-screen w-96 border-l border-[#2a2a3e] bg-[#0a0a0a]">
          <SovrynChat />
        </div>
      )}
    </div>
  );
}
```

---

### **Pattern 3: Tabbed Interface**

Add chat as a tab in your existing interface.

**File:** `web/src/app/wallet/page.tsx`

```tsx
'use client';

import { SovrynChat } from '@/components/sovryn/SovrynChat';
import { useState } from 'react';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'chat'>('balance');

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[#2a2a3e]">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'balance' 
              ? 'text-[#ffd93d] border-b-2 border-[#ffd93d]' 
              : 'text-gray-400'
          }`}
        >
          💰 Balance
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'transactions' 
              ? 'text-[#ffd93d] border-b-2 border-[#ffd93d]' 
              : 'text-gray-400'
          }`}
        >
          📊 Transactions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'chat' 
              ? 'text-[#ffd93d] border-b-2 border-[#ffd93d]' 
              : 'text-gray-400'
          }`}
        >
          🏛️ Ask SOVRYN AI
        </button>
      </div>

      {/* Tab Content */}
      <div className="h-[700px]">
        {activeTab === 'balance' && <BalanceView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'chat' && <SovrynChat />}
      </div>
    </div>
  );
}
```

---

### **Pattern 4: Inline Help Widget**

Add contextual help with SOVRYN AI on specific pages.

**File:** `web/src/app/vitalization/page.tsx`

```tsx
'use client';

import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function VitalizationPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
      {/* Main Content (2/3) */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-8">Sovereign Pulse Vitalization</h1>
        
        {/* Vitalization form/steps */}
        <div className="space-y-6">
          {/* Your vitalization content */}
        </div>
      </div>

      {/* Help Sidebar (1/3) */}
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <h2 className="text-xl font-semibold mb-4 text-[#ffd93d]">
            Need Help?
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Ask SOVRYN AI about the vitalization process
          </p>
          <div className="h-[600px]">
            <SovrynChat />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### **Pattern 5: Collapsible Panel**

Add a collapsible chat panel at the bottom of the page.

**File:** `web/src/components/sovryn/CollapsibleChat.tsx`

```tsx
'use client';

import { useState } from 'react';
import { SovrynChat } from './SovrynChat';

export function CollapsibleChat() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-t border-[#2a2a3e] px-6 py-4 flex items-center justify-between hover:bg-[#1e1e2e] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <span className="text-white font-semibold">SOVRYN AI Assistant</span>
          <span className="text-xs text-gray-400">
            Ask about VIDA, vitalization, or treasury
          </span>
        </div>
        <span className="text-[#ffd93d]">
          {isExpanded ? '▼ Minimize' : '▲ Expand'}
        </span>
      </button>

      {/* Chat Panel */}
      {isExpanded && (
        <div className="h-[500px] border-t border-[#2a2a3e]">
          <SovrynChat />
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Styling Tips

### **Match Your Theme**

```tsx
<SovrynChat 
  className="
    bg-gradient-to-br from-purple-900 to-blue-900
    border-2 border-purple-500
    rounded-3xl
    shadow-2xl
  "
/>
```

### **Compact Mode**

```tsx
<div className="h-[400px]">
  <SovrynChat />
</div>
```

### **Full Screen**

```tsx
<div className="h-screen">
  <SovrynChat />
</div>
```

---

## 🔧 Advanced Usage

### **Pre-fill Message**

```tsx
'use client';

import { SovrynChat } from '@/components/sovryn/SovrynChat';
import { useEffect } from 'react';

export default function HelpPage() {
  useEffect(() => {
    // Pre-fill the input with a question
    const input = document.querySelector('input[placeholder*="Ask about"]') as HTMLInputElement;
    if (input) {
      input.value = "How do I get started with vitalization?";
      input.focus();
    }
  }, []);

  return <SovrynChat />;
}
```

### **Context from URL**

```tsx
'use client';

import { SovrynChat } from '@/components/sovryn/SovrynChat';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get('wallet');
  const phone = searchParams.get('phone');

  return (
    <SovrynChat 
      walletAddress={wallet || undefined}
      phoneNumber={phone || undefined}
    />
  );
}
```

---

## ✅ Best Practices

1. **Always provide user context** when available (wallet, phone)
2. **Use appropriate height** for the container (minimum 400px)
3. **Consider mobile users** - use responsive layouts
4. **Add loading states** while fetching user data
5. **Handle errors gracefully** - show fallback UI
6. **Test with backend offline** - ensure error messages work

---

**🎉 Choose the pattern that fits your use case and start integrating!**

