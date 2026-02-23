/**
 * VLT Ledger — RAT (Verified Fact). Companion uses this for PFF metrics; no generative guess.
 */

import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

export interface VltPffMetricsPayload {
  source: string;
  citizens_vitalized: number;
  total_vida_minted: number;
  last_ledger_activity_iso: string | null;
  _fallback?: boolean;
  _message?: string;
}

/** Detect if the user is asking for PFF/ledger metrics (verified-only response). */
export function isPffMetricsRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    /pff metrics|ledger metrics|how many (citizens?|people|users?) (have )?vitalized|vitalized count|citizen count|total vitalized|vlt (stats|metrics|numbers)|chain stats|verified (metrics|stats|numbers)/i.test(t) ||
    /combien de citoyens|métriques pff|estadísticas del protocolo|cuántos vitalizados/i.test(t)
  );
}

/** Format verified PFF metrics for the Companion (multilingual). */
export function formatVerifiedPffMetrics(
  lang: CompanionLangCode,
  payload: VltPffMetricsPayload
): string {
  const { citizens_vitalized, total_vida_minted, last_ledger_activity_iso, _fallback } = payload;
  const fromChain = _fallback
    ? ''
    : '\n\nThis is a Verified Fact from the VLT Ledger. Not a generative guess.';

  const byLang: Record<CompanionLangCode, string> = {
    en: `From the VLT Ledger: ${citizens_vitalized} citizens have vitalized; ${total_vida_minted.toFixed(2)} VIDA minted on-chain.${last_ledger_activity_iso ? ` Last ledger activity: ${last_ledger_activity_iso.slice(0, 10)}.` : ''}${fromChain}`,
    fr: `Depuis le registre VLT : ${citizens_vitalized} citoyens ont vitalisé ; ${total_vida_minted.toFixed(2)} VIDA frappées on-chain.${last_ledger_activity_iso ? ` Dernière activité : ${last_ledger_activity_iso.slice(0, 10)}.` : ''}${fromChain}`,
    es: `Desde el libro VLT: ${citizens_vitalized} ciudadanos han vitalizado; ${total_vida_minted.toFixed(2)} VIDA acuñadas on-chain.${last_ledger_activity_iso ? ` Última actividad: ${last_ledger_activity_iso.slice(0, 10)}.` : ''}${fromChain}`,
    yo: `Lati inu VLT Ledger: ${citizens_vitalized} awọn ara ilu ti vitalize; ${total_vida_minted.toFixed(2)} VIDA minted lori chain.${fromChain}`,
    ig: `Site na VLT Ledger: ndị obodo ${citizens_vitalized} vitalized; ${total_vida_minted.toFixed(2)} VIDA minted na chain.${fromChain}`,
    ha: `Daga VLT Ledger: ƙasashe ${citizens_vitalized} sun vitalize; ${total_vida_minted.toFixed(2)} VIDA an ƙera a kan chain.${fromChain}`,
    zh: `来自 VLT 账本：${citizens_vitalized} 位公民已活力化；链上铸造 ${total_vida_minted.toFixed(2)} VIDA。${fromChain}`,
    ar: `من سجل VLT: ${citizens_vitalized} مواطنون استشهدوا؛ ${total_vida_minted.toFixed(2)} VIDA مسكوكة على السلسلة.${fromChain}`,
  };
  return byLang[lang] ?? byLang.en;
}
