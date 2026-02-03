# MULTI-LANGUAGE ENGINE & UI SWITCHER

**Architect**: Isreal Okoro (mrfundzman)  
**Date**: 2026-02-03  
**Status**: ✅ IMPLEMENTED

---

## 🌐 OVERVIEW

The PFF Multi-Language Engine provides comprehensive internationalization (i18n) support with 7 languages, automatic browser detection, and dynamic translation capabilities. The system ensures that all PFF terms, banking terminology, and UI elements are properly localized while maintaining visual integrity across all languages.

---

## 🗣️ SUPPORTED LANGUAGES

| Code | Language | Native Name | Flag | Direction |
|------|----------|-------------|------|-----------|
| `en` | English | English | 🇬🇧 | LTR |
| `yo` | Yoruba | Yorùbá | 🇳🇬 | LTR |
| `ha` | Hausa | Hausa | 🇳🇬 | LTR |
| `ig` | Igbo | Igbo | 🇳🇬 | LTR |
| `fr` | French | Français | 🇫🇷 | LTR |
| `es` | Spanish | Español | 🇪🇸 | LTR |
| `zh` | Chinese | 中文 | 🇨🇳 | LTR |

**Default Language**: English (EN)  
**RTL Support**: Prepared for future Arabic/Hebrew support

---

## 📁 FILE STRUCTURE

### **Locale Files**
```
web/lib/i18n/locales/
├── en.json  # English (Default)
├── yo.json  # Yoruba
├── ha.json  # Hausa
├── ig.json  # Igbo
├── fr.json  # French
├── es.json  # Spanish
└── zh.json  # Mandarin Chinese
```

### **Core Files**
- `web/lib/i18n/config.ts` - Language configuration & detection logic
- `web/lib/i18n/TranslationContext.tsx` - React Context & useTranslation hook
- `web/lib/i18n/index.ts` - Public API exports
- `web/components/ui/LanguageSwitcher.tsx` - Globe Icon dropdown UI

### **Demo Page**
- `web/src/app/language-demo/page.tsx` - Full system demonstration

---

## 🔑 CORE PFF TERMS TRANSLATED

### **PFF Terminology**
- **Total PFF Balance** - The grand total display
- **National Vault** - Sovereign storage system
- **Spendable VIDA** - 20% liquid VIDA CAP
- **Sovereign Share** - User's ownership stake
- **VIDA CAP** - Base economic unit
- **Presence Factor Fabric** - Core protocol name
- **Architect Vault** - Creator's 5 VIDA CAP
- **State Vault** - Government's 5 VIDA CAP
- **Locked Until 1B** - 80% lock condition

### **Banking Terms**
- **Fundzman by UBA** - Sovereign default account
- **Pre-Activated** - Ready-to-use status
- **National Block Account** - Blockchain-backed account
- **Legacy Accounts** - External bank connections
- **Link External Institution** - Account linking action

### **Features**
- **Instant Transfers** - Zero-latency transactions
- **Biometric Lock** - 4-layer authentication
- **Global Access** - 220M node network
- **VIDA Bridge** - Crypto-fiat conversion
- **Zero Fees** - No transaction costs

---

## 🛠️ USAGE

### **1. Wrap Your App with TranslationProvider**

```typescript
// app/layout.tsx or page.tsx
import { TranslationProvider } from '@/lib/i18n';

export default function RootLayout({ children }) {
  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  );
}
```

### **2. Use the Translation Hook in Components**

```typescript
import { useTranslation } from '@/lib/i18n';

export function MyComponent() {
  const { t, language, setLanguage, direction } = useTranslation();

  return (
    <div dir={direction}>
      <h1>{t('pff.totalPFFBalance')}</h1>
      <p>{t('banking.fundzmanByUBA')}</p>
      <p>{t('companion.greeting')}</p>
    </div>
  );
}
```

### **3. Add Language Switcher to Header**

```typescript
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <h1>PFF Dashboard</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

---

## 🎨 LANGUAGE SWITCHER UI

### **Design Features**
- **Globe Icon (🌐)** - Universal language symbol
- **Black & Gold Glassmorphism** - Matches PFF design system
- **Dropdown Menu** - All 7 languages with flags
- **Active Indicator** - Green pulsing dot for current language
- **Hover Effects** - Gold glow on hover
- **Responsive** - Works on mobile and desktop

### **Styling**
```css
Background: from-[#1a1a1e]/80 via-[#0d0d0f]/80 to-[#1a1a1e]/80
Border: border-[#e8c547]/30 → hover:border-[#e8c547]/60
Shadow: hover:shadow-[0_0_20px_rgba(232,197,71,0.3)]
Backdrop: backdrop-blur-md
```

---

## 🔍 AUTO-DETECTION LOGIC

### **Detection Flow**
1. **Check localStorage** - Look for saved preference (`pff_language_preference`)
2. **Detect Browser Language** - Read `navigator.language`
3. **Map to Supported Language** - Match language code (e.g., `en-US` → `en`)
4. **Fallback to English** - If language not supported

### **Example**
```typescript
Browser Language: "yo-NG" → Detected: "yo" (Yoruba)
Browser Language: "ar-SA" → Detected: "en" (English fallback)
Browser Language: "fr-FR" → Detected: "fr" (French)
```

---

## 📝 TRANSLATION KEY STRUCTURE

### **Nested JSON Format**
```json
{
  "pff": {
    "totalPFFBalance": "Total PFF Balance",
    "nationalVault": "National Vault"
  },
  "banking": {
    "fundzmanByUBA": "Fundzman by UBA"
  },
  "companion": {
    "greeting": "Hello, Sovereign Citizen"
  }
}
```

### **Accessing Translations**
```typescript
t('pff.totalPFFBalance')           // "Total PFF Balance"
t('banking.fundzmanByUBA')         // "Fundzman by UBA"
t('companion.greeting')            // "Hello, Sovereign Citizen"
t('nonexistent.key', 'Fallback')   // "Fallback"
```

---

## 🌍 RTL (RIGHT-TO-LEFT) PREPARATION

### **Current Status**
All current languages use **LTR (Left-to-Right)** direction.

### **Future RTL Support**
The system is prepared for RTL languages (Arabic, Hebrew):

```typescript
// Automatic direction application
document.documentElement.dir = config.direction; // 'ltr' or 'rtl'

// CSS will automatically flip for RTL
<div dir={direction}>
  {/* Content automatically mirrors for RTL */}
</div>
```

### **Visual Integrity**
- **10 VIDA CAP Vault Alignment** - Uses flexbox with `justify-between`
- **Number Formatting** - Locale-aware with `toLocaleString()`
- **Icons & Emojis** - Neutral positioning
- **Gradients** - Symmetric designs work in both directions

---

## 🤖 SOVRYN COMPANION INTEGRATION

### **Companion Messages Translated**
```typescript
companion.greeting          // "Hello, Sovereign Citizen"
companion.vitalized         // "I am Vitalized"
companion.howCanIHelp       // "How can I assist you today?"
companion.processingRequest // "Processing your request..."
companion.requestComplete   // "Request complete"
```

### **Language-Aware Communication**
The Companion will automatically switch its communication style based on the selected language:

- **English**: Formal, professional
- **Yoruba**: Respectful, traditional greetings
- **Hausa**: Polite, community-focused
- **Igbo**: Warm, family-oriented
- **French**: Formal, elegant
- **Spanish**: Friendly, approachable
- **Chinese**: Respectful, concise

---

## ✅ IMPLEMENTATION CHECKLIST

- [x] 7 Language JSON Files Created
- [x] Translation Configuration System
- [x] TranslationProvider Context
- [x] useTranslation Hook
- [x] Auto-Detection Logic
- [x] localStorage Persistence
- [x] Language Switcher UI Component
- [x] Black & Gold Glassmorphism Styling
- [x] Demo Page
- [x] Documentation
- [ ] Integrate into Main Dashboard
- [ ] Update All Components with Translations
- [ ] Sovryn Companion Language Switching
- [ ] Mobile Testing
- [ ] Production Deployment

---

## 🚀 DEMO PAGE

**URL**: `/language-demo`

**Features**:
- Live language switching
- Translation examples for all categories
- Current language display
- 7 language support showcase
- Auto-detection demonstration

---

**System Status**: ✅ CORE IMPLEMENTATION COMPLETE

