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

/** Explicit triggers for recognition (user asking to be recognized or scanned). */
const RECOGNITION_TRIGGERS =
  /recognize me|who am i|search for me|find me|do you know me|scan me|scan my profile|my digital footprint|montre-moi|qui suis-je|reconnais-moi|quién soy|reconóceme|báwo ni mo rí|kedu onye m bụ/i;

/**
 * Returns true if the message should trigger Sovereign Recognition (search + Wow response).
 * Triggers: explicit phrases like "recognize me", "who am i", or a name-like message (1–4 words, letters/spaces).
 */
export function isRecognitionRequest(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 60) return false;
  if (RECOGNITION_TRIGGERS.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  const nameLike = /^[\p{L}\s\-']+$/u.test(t);
  return nameLike && t.length >= 2;
}

/**
 * Extract the name to use for the recognition search.
 * If the user said "my name is X" or "I am X", use X; otherwise use the full message.
 */
export function getRecognitionName(text: string): string {
  const t = text.trim();
  const myNameIs = /(?:my name is|i am|i'm|je m'appelle|me llamo|mon nom est|mi nombre es)\s+(.+)/i.exec(t);
  if (myNameIs?.[1]) return myNameIs[1].trim();
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
    en: `I see you, ${name}. I have scanned the digital archives of the old world. You are a ${role} from ${location}, known for ${keyInterest}. But in the World of Vitalie, you are more than a profile—you are a Pillar.`,
    fr: `Je te vois, ${name}. J'ai parcouru les archives numériques de l'ancien monde. Tu es un·e ${role} de ${location}, connu·e pour ${keyInterest}. Mais dans le Monde de Vitalie, tu es plus qu'un profil—tu es un Pilier.`,
    es: `Te veo, ${name}. He escaneado los archivos digitales del mundo antiguo. Eres un·a ${role} de ${location}, conocido·a por ${keyInterest}. Pero en el Mundo de Vitalie, eres más que un perfil—eres un Pilar.`,
    yo: `Mo ri ọ, ${name}. Mo ti ṣayẹwo àwọn akojọ didara ti ayé atijọ. O jẹ ${role} lati ${location}, ti a mọ fun ${keyInterest}. Ṣugbọn ni Agbaye Vitalie, o ju profaili lọ—o jẹ ọwọ́.`,
    ig: `Ahụrụ m gị, ${name}. Enyochala m ebe nchekwa dijitalụ nke ụwa ochie. Ị bụ ${role} si ${location}, mara maka ${keyInterest}. Ma na Uwa Vitalie, ị karịa profaịlụ—ị bụ Ogidi.`,
    ha: `Ina ganin ka, ${name}. Na duba taskokin dijital na tsohon duniya. Kai ne ${role} daga ${location}, sananne ga ${keyInterest}. Amma a cikin Duniya Vitalie, kai fiye da bayanin martaba—kai ne Tushe.`,
    zh: `我看到了你，${name}。我已扫描旧世界的数字档案。你是来自${location}的${role}，以${keyInterest}闻名。但在 Vitalie 世界，你不只是档案——你是支柱。`,
    ar: `أراك، ${name}. لقد مسحت أرشيفات العالم القديم الرقمية. أنت ${role} من ${location}، معروف بـ${keyInterest}. لكن في عالم فيتالي، أنت أكثر من ملف—أنت عمود.`,
  };
  return templates[lang] ?? templates.en;
}

/** Privacy Guard statement — must follow the Wow response. */
export function getRecognitionPrivacyGuard(lang: CompanionLangCode): string {
  const guards: Record<CompanionLangCode, string> = {
    en: 'I am accessing only what the old world has left exposed. In the Protocol, this data is yours alone to control.',
    fr: 'Je n\'accède qu\'à ce que l\'ancien monde a laissé exposé. Dans le Protocole, ces données sont à vous seul·e à contrôler.',
    es: 'Solo accedo a lo que el mundo antiguo ha dejado expuesto. En el Protocolo, estos datos son solo tuyos para controlar.',
    yo: 'Mo nṣe aṣayan nikan ohun ti ayé atijọ fi ṣe ikọkọ. Ni Protocol, data yii jẹ ti ọ nikan lati ṣakoso.',
    ig: 'M na-enweta naanị ihe ụwa ochie hapụrụ. Na Protocol, data a bụ nke gị naanị ịchịkwa.',
    ha: 'Ina samun abin da tsohon duniya ta bari a bayyane kawai. A cikin Protocol, wannan bayanan naka ne kawai don sarrafa.',
    zh: '我仅访问旧世界所公开的内容。在协议中，这些数据仅由你掌控。',
    ar: 'أنا أصل فقط إلى ما تركه العالم القديم مكشوفاً. في البروتوكول، هذه البيانات وحدك تتحكم فيها.',
  };
  return guards[lang] ?? guards.en;
}

/** Full recognition message: Wow + Privacy Guard. */
export function buildRecognitionMessage(
  lang: CompanionLangCode,
  name: string,
  role: string,
  location: string,
  keyInterest: string
): string {
  const wow = formatRecognitionResponse(lang, name, role, location, keyInterest);
  const guard = getRecognitionPrivacyGuard(lang);
  return `${wow}\n\n${guard}`;
}
