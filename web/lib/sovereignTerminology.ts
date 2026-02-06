/**
 * Sovereign Terminology — Multi-Language Logic Tier.
 * High-weighting for local dialects: when the user speaks a local language,
 * the Companion uses these terms (e.g. VIDA CAP as "Covenant Asset" in Yoruba).
 */

import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

export type SovereignTermKey = 'VIDA_CAP' | 'COVENANT_ASSET' | 'TRUTH_LEDGER' | 'VITALIZATION' | 'PRESENCE' | 'PILLAR';

const TERMINOLOGY: Record<SovereignTermKey, Record<CompanionLangCode, string>> = {
  VIDA_CAP: {
    en: 'VIDA CAP',
    fr: 'VIDA CAP',
    es: 'VIDA CAP',
    yo: 'VIDA CAP',
    ig: 'VIDA CAP',
    ha: 'VIDA CAP',
    zh: 'VIDA CAP',
    ar: 'VIDA CAP',
  },
  COVENANT_ASSET: {
    en: 'Covenant Asset',
    fr: 'Actif de l\'Alliance',
    es: 'Activo del Pacto',
    yo: 'Ohun-ini Ọgbụgba ndụ',
    ig: 'Akụ Ọgbụgba ndụ',
    ha: 'Kadarin Alkawari',
    zh: '盟约资产',
    ar: 'أصل العهد',
  },
  TRUTH_LEDGER: {
    en: 'Truth Ledger',
    fr: 'Registre de Vérité',
    es: 'Libro de Verdad',
    yo: 'Iwé Ìkọọlẹ Ọtọ',
    ig: 'Akwụkwọ ndekọ Eziokwu',
    ha: 'Littafin Gaskiya',
    zh: '真相账本',
    ar: 'سجل الحقيقة',
  },
  VITALIZATION: {
    en: 'Vitalization',
    fr: 'Vitalisation',
    es: 'Vitalización',
    yo: 'Ìṣààyè',
    ig: 'Vitalization',
    ha: 'Rayuwa',
    zh: '活力化',
    ar: 'الاستشهاد',
  },
  PRESENCE: {
    en: 'Presence',
    fr: 'Présence',
    es: 'Presencia',
    yo: 'Iwọ',
    ig: 'Ọnụnọ',
    ha: 'Kasancewa',
    zh: '存在',
    ar: 'الحضور',
  },
  PILLAR: {
    en: 'Pillar',
    fr: 'Pilier',
    es: 'Pilar',
    yo: 'Ọwọ́',
    ig: 'Ogidi',
    ha: 'Tushe',
    zh: '支柱',
    ar: 'عمود',
  },
};

/** Get the Sovereign term for a key in the given language (local-dialect weighting). */
export function getSovereignTerm(lang: CompanionLangCode, key: SovereignTermKey): string {
  const map = TERMINOLOGY[key];
  return map?.[lang] ?? map?.en ?? key;
}
