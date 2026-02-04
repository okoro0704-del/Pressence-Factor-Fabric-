/**
 * I18N CONFIGURATION
 * Multi-language support for PFF platform (ISO 639-1)
 * Major global languages + Nigerian languages for sovereign mesh
 */

export type LanguageCode =
  | 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'hi' | 'pt' | 'ru' | 'ja' | 'de' | 'sw'
  | 'yo' | 'ha' | 'ig';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

/** Major global languages (requested) + Nigerian languages */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  { code: 'zh', name: 'Mandarin', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', direction: 'ltr', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', direction: 'ltr', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', direction: 'ltr', flag: '🇳🇬' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_STORAGE_KEY = 'pff_language_preference';

/**
 * Detect browser language and map to supported language
 * Falls back to English if not recognized
 */
export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  const languageMap: Record<string, LanguageCode> = {
    en: 'en', es: 'es', fr: 'fr', ar: 'ar', zh: 'zh', hi: 'hi', pt: 'pt',
    ru: 'ru', ja: 'ja', de: 'de', sw: 'sw', yo: 'yo', ha: 'ha', ig: 'ig',
  };

  return languageMap[langCode] || DEFAULT_LANGUAGE;
}

/**
 * Get stored language preference from localStorage
 */
export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
      return stored as LanguageCode;
    }
  } catch (error) {
    console.error('Error reading language preference:', error);
  }

  return null;
}

/**
 * Store language preference in localStorage
 */
export function storeLanguage(languageCode: LanguageCode): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error storing language preference:', error);
  }
}

/**
 * Get language configuration by code
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
}

/** Instruction screen copy (3-of-4 biometric flow) — localized per language */
export interface InstructionStrings {
  title: string;
  subtitle: string;
  /** Main instruction: "Read the following text clearly after the beep." */
  readAfterBeep: string;
  chooseHowToLearn: string;
  readText: string;
  repeatAfterAudio: string;
  continueToIdentityAnchor: string;
  skipToIdentityAnchor: string;
  phrasePrompt: string;
  phraseHint: string;
  vitalizationPhrase: string;
  /** Elder (65+) / Minor (under 18): voice verification bypassed. */
  voiceBypassMessage: string;
}

const INSTRUCTION_STRINGS: Record<string, InstructionStrings> = {
  en: {
    title: 'Vocal Verification',
    subtitle: 'When prompted, you will say the phrase below. Verification happens only when the hardware captures your voice.',
    readAfterBeep: 'Read the following text clearly after the beep.',
    chooseHowToLearn: 'Choose how you want to learn the phrase:',
    readText: 'Read text',
    repeatAfterAudio: 'Repeat after audio guide',
    continueToIdentityAnchor: 'Continue to Identity Anchor',
    skipToIdentityAnchor: 'Skip to Identity Anchor (phone number)',
    phrasePrompt: 'You will be asked to say this phrase during the biometric scan. No verification until then.',
    phraseHint: 'Say the phrase when prompted.',
    vitalizationPhrase: 'I am Vitalized',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  es: {
    title: 'Verificación vocal',
    subtitle: 'Cuando se le indique, dirá la frase siguiente. La verificación ocurre solo cuando el hardware captura su voz.',
    readAfterBeep: 'Lea el siguiente texto claramente después del pitido.',
    chooseHowToLearn: 'Elija cómo desea aprender la frase:',
    readText: 'Leer texto',
    repeatAfterAudio: 'Repetir después del audio',
    continueToIdentityAnchor: 'Continuar al ancla de identidad',
    skipToIdentityAnchor: 'Saltar al ancla de identidad (número de teléfono)',
    phrasePrompt: 'Se le pedirá decir esta frase durante el escaneo biométrico.',
    phraseHint: 'Diga la frase cuando se le indique.',
    vitalizationPhrase: 'Estoy Vitalizado',
    voiceBypassMessage: 'Verificación de voz omitida por protección soberana. Haga clic en siguiente para continuar.',
  },
  fr: {
    title: 'Vérification vocale',
    subtitle: 'À l\'invite, vous direz la phrase ci-dessous. La vérification n\'a lieu que lorsque le matériel capture votre voix.',
    readAfterBeep: 'Lisez clairement le texte suivant après le bip.',
    chooseHowToLearn: 'Choisissez comment apprendre la phrase :',
    readText: 'Lire le texte',
    repeatAfterAudio: 'Répéter après l\'audio',
    continueToIdentityAnchor: 'Continuer vers l\'ancre d\'identité',
    skipToIdentityAnchor: 'Passer à l\'ancre d\'identité (numéro de téléphone)',
    phrasePrompt: 'Vous devrez dire cette phrase pendant la numérisation biométrique.',
    phraseHint: 'Dites la phrase à l\'invite.',
    vitalizationPhrase: 'Je suis Vitalized',
    voiceBypassMessage: 'Vérification vocale contournée pour protection souveraine. Cliquez sur suivant pour continuer.',
  },
  ar: {
    title: 'التحقق الصوتي',
    subtitle: 'عند الطلب، ستقول العبارة أدناه. يحدث التحقق فقط عندما يلتقط الجهاز صوتك.',
    readAfterBeep: 'اقرأ النص التالي بوضوح بعد سماع الصافرة.',
    chooseHowToLearn: 'اختر كيف تريد تعلم العبارة:',
    readText: 'قراءة النص',
    repeatAfterAudio: 'كرر بعد الصوت',
    continueToIdentityAnchor: 'المتابعة إلى مرساة الهوية',
    skipToIdentityAnchor: 'تخطي إلى مرساة الهوية (رقم الهاتف)',
    phrasePrompt: 'سيُطلب منك قول هذه العبارة أثناء المسح البيومتري.',
    phraseHint: 'قل العبارة عند الطلب.',
    vitalizationPhrase: 'أنا مفعّل',
    voiceBypassMessage: 'تم تجاوز التحقق الصوتي للحماية السيادية. انقر على التالي للمتابعة.',
  },
  zh: {
    title: '语音验证',
    subtitle: '系统提示时，您将说出下面的短语。仅当硬件捕获您的声音时才进行验证。',
    readAfterBeep: '请在提示音后清晰朗读以下文字。',
    chooseHowToLearn: '选择您要学习短语的方式：',
    readText: '阅读文字',
    repeatAfterAudio: '跟读音频',
    continueToIdentityAnchor: '继续到身份锚点',
    skipToIdentityAnchor: '跳过到身份锚点（电话号码）',
    phrasePrompt: '生物识别扫描时将要求您说出此短语。',
    phraseHint: '提示时说出短语。',
    vitalizationPhrase: '我已激活',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  hi: {
    title: 'मुखर सत्यापन',
    subtitle: 'जब संकेत दिया जाएगा, आप नीचे दिया गया वाक्य बोलेंगे। सत्यापन तभी होता है जब हार्डवेयर आपकी आवाज़ कैप्चर करता है।',
    readAfterBeep: 'बीप के बाद निम्नलिखित पाठ को स्पष्ट रूप से पढ़ें।',
    chooseHowToLearn: 'वाक्य सीखने का तरीका चुनें:',
    readText: 'पाठ पढ़ें',
    repeatAfterAudio: 'ऑडियो के बाद दोहराएं',
    continueToIdentityAnchor: 'पहचान एंकर पर जाएं',
    skipToIdentityAnchor: 'पहचान एंकर पर जाएं (फ़ोन नंबर)',
    phrasePrompt: 'बायोमेट्रिक स्कैन के दौरान यह वाक्य बोलने के लिए कहा जाएगा।',
    phraseHint: 'संकेत पर वाक्य बोलें।',
    vitalizationPhrase: 'मैं सक्रिय हूं',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  pt: {
    title: 'Verificação vocal',
    subtitle: 'Quando solicitado, você dirá a frase abaixo. A verificação ocorre apenas quando o hardware captura sua voz.',
    readAfterBeep: 'Leia o seguinte texto claramente após o bipe.',
    chooseHowToLearn: 'Escolha como deseja aprender a frase:',
    readText: 'Ler texto',
    repeatAfterAudio: 'Repetir após o áudio',
    continueToIdentityAnchor: 'Continuar para âncora de identidade',
    skipToIdentityAnchor: 'Pular para âncora de identidade (número de telefone)',
    phrasePrompt: 'Você será solicitado a dizer esta frase durante a varredura biométrica.',
    phraseHint: 'Diga a frase quando solicitado.',
    vitalizationPhrase: 'Estou Vitalizado',
    voiceBypassMessage: 'Verificação de voz dispensada para Proteção Soberana. Clique em próximo para continuar.',
  },
  ru: {
    title: 'Голосовая верификация',
    subtitle: 'По запросу вы произнесёте фразу ниже. Проверка происходит только когда оборудование захватывает ваш голос.',
    readAfterBeep: 'Читайте следующий текст чётко после звукового сигнала.',
    chooseHowToLearn: 'Выберите, как вы хотите выучить фразу:',
    readText: 'Читать текст',
    repeatAfterAudio: 'Повторить после аудио',
    continueToIdentityAnchor: 'Продолжить к якорю идентичности',
    skipToIdentityAnchor: 'Пропустить к якорю идентичности (номер телефона)',
    phrasePrompt: 'Вам нужно будет произнести эту фразу во время биометрического сканирования.',
    phraseHint: 'Скажите фразу по запросу.',
    vitalizationPhrase: 'Я активирован',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  ja: {
    title: '音声認証',
    subtitle: '指示に従い、以下のフレーズを話してください。認証はハードウェアがあなたの声をキャプチャしたときのみ行われます。',
    readAfterBeep: 'ビープ音の後に次のテキストをはっきりと読んでください。',
    chooseHowToLearn: 'フレーズの覚え方を選んでください：',
    readText: 'テキストを読む',
    repeatAfterAudio: '音声の後に繰り返す',
    continueToIdentityAnchor: 'IDアンカーへ進む',
    skipToIdentityAnchor: 'IDアンカーへスキップ（電話番号）',
    phrasePrompt: '生体スキャン中にこのフレーズを言うよう求められます。',
    phraseHint: '指示に従ってフレーズを言ってください。',
    vitalizationPhrase: '私は活性化されています',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  de: {
    title: 'Stimmverifizierung',
    subtitle: 'Auf Aufforderung sagen Sie den unten stehenden Satz. Die Verifizierung erfolgt nur, wenn die Hardware Ihre Stimme erfasst.',
    readAfterBeep: 'Lesen Sie den folgenden Text nach dem Signalton deutlich vor.',
    chooseHowToLearn: 'Wählen Sie, wie Sie den Satz lernen möchten:',
    readText: 'Text lesen',
    repeatAfterAudio: 'Nach Audio wiederholen',
    continueToIdentityAnchor: 'Weiter zum Identitätsanker',
    skipToIdentityAnchor: 'Zum Identitätsanker springen (Telefonnummer)',
    phrasePrompt: 'Sie werden gebeten, diesen Satz während des biometrischen Scans zu sagen.',
    phraseHint: 'Sagen Sie den Satz auf Aufforderung.',
    vitalizationPhrase: 'Ich bin vitalisiert',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  sw: {
    title: 'Uthibitishaji wa sauti',
    subtitle: 'Unapoambiwa, utasema kifungu hapa chini. Uthibitishaji hutokea tu wakati vifaa vinapokamata sauti yako.',
    readAfterBeep: 'Soma maandishi yafuatayo kwa wazi baada ya mlio.',
    chooseHowToLearn: 'Chagua jinsi unavyotaka kujifunza kifungu:',
    readText: 'Soma maandishi',
    repeatAfterAudio: 'Rudia baada ya sauti',
    continueToIdentityAnchor: 'Endelea kwa nanga ya utambulisho',
    skipToIdentityAnchor: 'Ruka kwa nanga ya utambulisho (nambari ya simu)',
    phrasePrompt: 'Utaulizwa kusema kifungu hiki wakati wa skeni ya biometric.',
    phraseHint: 'Sema kifungu unapoambiwa.',
    vitalizationPhrase: 'Nimehaiwa',
    voiceBypassMessage: 'Uthibitishaji wa sauti umepitwa kwa ulinzi wa Enzi. Bofya inayofuata kuendelea.',
  },
  yo: {
    title: 'Ìwé-ẹri ohùn',
    subtitle: 'Nigba ti a bá sọ, iwọ yoo sọ ọrọ isalẹ. Ìwé-ẹri waye nikan nigbati ẹrọ gba ohùn rẹ.',
    readAfterBeep: 'Ka ọrọ wọnyi ni ṣe kedere lẹhin ohùn.',
    chooseHowToLearn: 'Yan bí o fẹ kọ ọrọ naa:',
    readText: 'Ka ọrọ',
    repeatAfterAudio: 'Tún lẹhin ohùn',
    continueToIdentityAnchor: 'Lọ sí Identity Anchor',
    skipToIdentityAnchor: 'Fọwọ sí Identity Anchor (nọmba foonu)',
    phrasePrompt: 'A ó beere láti sọ ọrọ yìí nigbati a bá scan biometric.',
    phraseHint: 'Sọ ọrọ nigbati a bá sọ.',
    vitalizationPhrase: 'Mo ti Vitalized',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  ha: {
    title: 'Tabbatarwar murya',
    subtitle: 'Lokacin da ake buƙata, za ka faɗi jumlar da ke ƙasa. Tabbatarwa tana faruwa ne kawai lokacin da na\'urar ta ɗauki muryarka.',
    readAfterBeep: 'Karanta rubutu na gaba da bayyane bayan ƙarar rawar.',
    chooseHowToLearn: 'Zaɓi yadda kake so ka koyi jumlar:',
    readText: 'Karanta rubutu',
    repeatAfterAudio: 'Maimaita bayan bidiyo',
    continueToIdentityAnchor: 'Ci gaba zuwa Identity Anchor',
    skipToIdentityAnchor: 'Tsallaka zuwa Identity Anchor (lambar waya)',
    phrasePrompt: 'Za a buƙaci ka faɗi wannan jumla yayin duban biometric.',
    phraseHint: 'Faɗi jumlar lokacin da ake buƙata.',
    vitalizationPhrase: 'Na Vitalized',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
  ig: {
    title: 'Nkwenye olu',
    subtitle: 'Mgbe a gwara gị, ị ga-ekwu ahịrịokwu dị n\'okpuru. Nkwenye na-eme naanị mgbe ngwaike na-ejide olu gị.',
    readAfterBeep: 'Gụọ ederede na-esonụ n\'ụzọ doro anya mgbe ụda ahụ gasịrị.',
    chooseHowToLearn: 'Họrọ otu ị chọrọ ịmụta ahịrịokwu:',
    readText: 'Gụọ ederede',
    repeatAfterAudio: 'Megharịa mgbe ọdịyo gasịrị',
    continueToIdentityAnchor: 'Gaa n\'ihu na Identity Anchor',
    skipToIdentityAnchor: 'Wepu gaa na Identity Anchor (nọmba ekwentị)',
    phrasePrompt: 'A ga-agwa gị ka ị sị nke a n\'oge nyocha biometric.',
    phraseHint: 'Kwuo ahịrịokwu mgbe a gwara gị.',
    vitalizationPhrase: 'Abụ m Vitalized',
    voiceBypassMessage: 'Voice verification bypassed for Sovereign Protection. Click next to continue.',
  },
};

export function getInstructionStrings(code: string): InstructionStrings {
  return INSTRUCTION_STRINGS[code] ?? INSTRUCTION_STRINGS.en;
}

