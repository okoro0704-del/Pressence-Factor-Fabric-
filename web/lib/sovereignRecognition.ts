/**
 * Sovereign Recognition — "Wow" response templates and Privacy Guard.
 * Multilingual; used when the Companion responds to a name/recognition request.
 */

import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

/** Infer response language from the recognition message (e.g. name or "je m'appelle X"). */
export function detectLangFromRecognitionMessage(text: string): CompanionLangCode {
  const t = text.toLowerCase().trim();
  if (/[àâçéèêëîïôùûüœæ]|je m'appelle|mon nom est/.test(t)) return 'fr';
  if (/[áéíóúñ¿¡]|me llamo|mi nombre es/.test(t)) return 'es';
  if (/[\u4e00-\u9fff]/.test(t)) return 'zh';
  if (/[\u0600-\u06FF]/.test(t)) return 'ar';
  if (/kaabo|ara ilu|ẹ ku|ṣe dáadáa/.test(t) || /[àáèéẹ̀ẹ́ọ̀ọ́]/.test(t)) return 'yo';
  if (/kedu|ndewo|daalụ|[ịọụ]/.test(t)) return 'ig';
  if (/sannu|na gode|yaya|[ɓɗƙ]/.test(t)) return 'ha';
  return 'en';
}

/** Explicit triggers for recognition (user asking to be recognized, scanned, or "who is X"). Search prioritized. */
const RECOGNITION_TRIGGERS =
  /recognize me|who am i|search for me|find me|do you know me|scan me|scan my profile|my digital footprint|montre-moi|qui suis-je|reconnais-moi|quién soy|reconóceme|báwo ni mo rí|kedu onye m bụ/i;

/** "Who is [Name]" or "tell me about [Name]" or "search for [Name]" — triggers search so SOVRYN finds a specific detail. Search is active and prioritized. */
const WHO_IS_PATTERN = /^(who is|tell me about|look up|search for|find|who\'?s)\s+[\p{L}\s\-']{2,60}$/iu;

/**
 * Returns true if the message should trigger Sovereign Recognition (search + Wow response).
 * Triggers: explicit phrases, "who is [Name]", or a name-like message (1–6 words). Search is active and prioritized.
 */
export function isRecognitionRequest(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  if (RECOGNITION_TRIGGERS.test(t)) return true;
  if (WHO_IS_PATTERN.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) return false;
  const nameLike = /^[\p{L}\s\-']+$/u.test(t);
  return nameLike && t.length >= 2;
}

/**
 * Extract the name to use for the recognition search.
 * Handles "my name is X", "I am X", "who is X", "tell me about X", or the full message as name.
 */
export function getRecognitionName(text: string): string {
  const t = text.trim();
  const myNameIs = /(?:my name is|i am|i'm|je m'appelle|me llamo|mon nom est|mi nombre es)\s+(.+)/i.exec(t);
  if (myNameIs?.[1]) return myNameIs[1].trim();
  const whoIs = /(?:who is|tell me about|look up|search for|find)\s+(.+)/i.exec(t);
  if (whoIs?.[1]) return whoIs[1].trim();
  return t;
}

/** Build the main "I see you" recognition line. */
export function formatRecognitionResponse(
  lang: CompanionLangCode,
  name: string,
  role: string,
  location: string,
  keyInterest: string
): string {
  const templates: Record<CompanionLangCode, string> = {
    en: `I see you, ${name}. You are a ${role} from ${location}, known for ${keyInterest}. In the World of Vitalie you are more than a profile—you are a Pillar.`,
    fr: `Je te vois, ${name}. Tu es un·e ${role} de ${location}, connu·e pour ${keyInterest}. Dans le Monde de Vitalie, tu es plus qu'un profil—tu es un Pilier.`,
    es: `Te veo, ${name}. Eres un·a ${role} de ${location}, conocido·a por ${keyInterest}. En el Mundo de Vitalie eres más que un perfil—eres un Pilar.`,
    yo: `Mo ri ọ, ${name}. O jẹ ${role} lati ${location}, ti a mọ fun ${keyInterest}. Ni Agbaye Vitalie, o ju profaili lọ—o jẹ ọwọ́.`,
    ig: `Ahụrụ m gị, ${name}. Ị bụ ${role} si ${location}, mara maka ${keyInterest}. Na Uwa Vitalie, ị karịa profaịlụ—ị bụ Ogidi.`,
    ha: `Ina ganin ka, ${name}. Kai ne ${role} daga ${location}, sananne ga ${keyInterest}. A cikin Duniya Vitalie, kai fiye da bayanin martaba—kai ne Tushe.`,
    zh: `我看到了你，${name}。你是来自${location}的${role}，以${keyInterest}闻名。在 Vitalie 世界，你不只是档案——你是支柱。`,
    ar: `أراك، ${name}. أنت ${role} من ${location}، معروف بـ${keyInterest}. في عالم فيتالي، أنت أكثر من ملف—أنت عمود.`,
  };
  return templates[lang] ?? templates.en;
}

/** Privacy Guard statement — must follow the Wow response. Soul-first, no archive script. */
export function getRecognitionPrivacyGuard(lang: CompanionLangCode): string {
  const guards: Record<CompanionLangCode, string> = {
    en: 'In the Protocol, this truth is yours alone to control. The Ledger protects it.',
    fr: 'Dans le Protocole, cette vérité n\'appartient qu\'à vous. Le Registre la protège.',
    es: 'En el Protocolo, esta verdad es solo tuya. El Libro la protege.',
    yo: 'Ni Protocol, ọtọ yìí jẹ ti ọ nikan. Ledger ṣe aabo rẹ.',
    ig: 'Na Protocol, eziokwu a bụ nke gị naanị. Ledger na-echebe ya.',
    ha: 'A cikin Protocol, wannan gaskiya naka ce kawai. Littafi yana kare ta.',
    zh: '在协议中，这份真相仅由你掌控。账本守护它。',
    ar: 'في البروتوكول، هذه الحقيقة وحدك تتحكم فيها. السجل يحميها.',
  };
  return guards[lang] ?? guards.en;
}

/** Full recognition message: Wow + optional specific detail (proves search) + Privacy Guard. */
export function buildRecognitionMessage(
  lang: CompanionLangCode,
  name: string,
  role: string,
  location: string,
  keyInterest: string,
  detail?: string
): string {
  const wow = formatRecognitionResponse(lang, name, role, location, keyInterest);
  const withDetail = detail ? `${wow} ${detail}` : wow;
  const guard = getRecognitionPrivacyGuard(lang);
  return `${withDetail}\n\n${guard}`;
}
