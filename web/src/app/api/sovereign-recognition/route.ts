/**
 * Sovereign Recognition (The Eyes) API.
 * Accepts a name and optional lang; returns a profile from digital archives (Serper/Tavily).
 * Keys: SERPER_API_KEY and TAVILY_API_KEY are read from .env.local (Next.js loads env for server routes).
 * Search results (name, role, location, keyInterest, detail) are the response context—the client
 * feeds them into buildRecognitionMessage() and never ignores them; when res.ok, the AI response
 * is built solely from this payload. On 4xx/5xx or timeout, client uses Linguistic Adaptation (no error UI).
 *
 * Netlify: redirect to web/netlify/functions/sovereign-recognition.js; set env vars in Netlify dashboard.
 *
 * Brevity Constraint (injected into Companion system prompt):
 * Your responses must be ultra-concise. For greetings or simple check-ins, do not exceed 15 words.
 * Avoid manifestos unless explicitly asked for a deep dive. Focus on being a partner, not a lecturer.
 * Simple test/greeting reply: "I see you, Architect. The pulse is steady. How are you?"
 */
export const SOVEREIGN_RECOGNITION_BREVITY_INSTRUCTION =
  'Your responses must be ultra-concise. For greetings or simple check-ins, do not exceed 15 words. Avoid manifestos unless explicitly asked for a deep dive. Focus on being a partner, not a lecturer.';

import { NextRequest, NextResponse } from 'next/server';
import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

// Diagnostic: only in non-production to avoid sensitive logs on live domain.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('SOVRYN Sight Check: ', process.env.SERPER_API_KEY ? 'ONLINE' : 'OFFLINE');
}

// Omit force-dynamic: incompatible with output: 'export' (static HTML). Use Netlify Function for server-side recognition on deploy.
export interface SovereignRecognitionPayload {
  name: string;
  lang?: CompanionLangCode | null;
}

export interface SovereignRecognitionResult {
  name: string;
  role: string;
  location: string;
  keyInterest: string;
  /** Specific detail to prove the search found something—soulful, not generic. */
  detail?: string;
  /** When set, result was about football/metal etc.; client must show sovereign reframe, not raw snippet. */
  sovereignReframe?: boolean;
  reframeTerm?: 'PFF' | 'VDM';
  /** ISO country from geo headers (e.g. NG, FR). Enables localized search and language offer. */
  country?: string;
  /** Suggested lang for this geography: France→fr, Nigeria→optional yo/ig/ha. */
  suggestedLang?: string;
}

/** Clarification protocol: when query (e.g. PFF/VDM) returns mixed categories, Governor asks which path. */
export interface SovereignClarificationPayload {
  clarificationRequired: true;
  query: string;
  categoryA: string;
  categoryB: string;
  country?: string;
  suggestedLang?: string;
}

const SERPER_URL = 'https://google.serper.dev/search';
const TAVILY_URL = 'https://api.tavily.com/search';

interface SerperOrganic {
  title?: string;
  snippet?: string;
  link?: string;
}
interface SerperKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  attributes?: Record<string, string>;
}
interface SerperResponse {
  organic?: SerperOrganic[];
  knowledgeGraph?: SerperKnowledgeGraph;
}

interface TavilyResult {
  title?: string;
  content?: string;
  url?: string;
}
interface TavilyResponse {
  results?: TavilyResult[];
  answer?: string;
}

/** Perception: read SERPER_API_KEY and TAVILY_API_KEY from env. Search uses Serper first, then Tavily fallback. */
function hasSerperSight(): boolean {
  return Boolean(typeof process !== 'undefined' && process.env.SERPER_API_KEY?.trim());
}

function hasTavilySight(): boolean {
  return Boolean(typeof process !== 'undefined' && process.env.TAVILY_API_KEY?.trim());
}

/**
 * Contextual anchoring: disambiguate PFF/VDM so search targets Vitalie and the Ledger, not football or metals.
 * Append Vitalie / Pure Freedom Foundation / Vitality Digital Money to ambiguous queries.
 */
function anchorSearchQuery(name: string): string {
  const t = name.trim().toUpperCase();
  if (t === 'PFF' || /^PFF\s*$/i.test(name.trim())) return `${name.trim()} Vitalie Pure Freedom Foundation`;
  if (t === 'VDM' || /^VDM\s*$/i.test(name.trim())) return `${name.trim()} Vitality Digital Money Ledger Architect`;
  return name.trim();
}

/** Country detection: Vercel, Cloudflare, Netlify geo headers. No IP lookup. */
function getCountryFromRequest(request: NextRequest): string | undefined {
  const h = request.headers;
  const code =
    h.get('x-vercel-ip-country') ??
    h.get('cf-ipcountry') ??
    h.get('x-nf-request-country') ??
    h.get('x-country-code') ??
    '';
  const c = (code || '').trim().toUpperCase();
  return c.length === 2 ? c : undefined;
}

/** Localized search: Nigeria → prioritize "[Query] Nigeria" for context-specific answers. */
function localizeQuery(queryBase: string, country: string | undefined): string {
  if (country === 'NG') return `${queryBase} Nigeria`;
  return queryBase;
}

/** Sentinel of the Covenant: ignore results about football (PFF) or metal companies (VDM). Only Architect, Ledger, Era of Light. */
function filterIdentityResult(result: SovereignRecognitionResult, originalQuery: string): SovereignRecognitionResult {
  const combined = [result.role, result.keyInterest, result.detail].filter(Boolean).join(' ').toLowerCase();
  const isFootball =
    /\b(football|soccer|premier\s*league|pff\s*(focus|rating|grade)|striker|midfielder|league\s*table|transfer)\b/i.test(combined);
  const isMetal =
    /\b(vdm\s*metal|vanadium|steel\s*company|metallurgy|vdm\s*gmbh|metal\s*group|alloy)\b/i.test(combined);
  if (isFootball && /pff|pure\s*freedom/i.test(originalQuery)) {
    return { ...result, sovereignReframe: true, reframeTerm: 'PFF', detail: undefined };
  }
  if (isMetal && /vdm/i.test(originalQuery)) {
    return { ...result, sovereignReframe: true, reframeTerm: 'VDM', detail: undefined };
  }
  return result;
}

/** Classify one organic result as covenant (Vitalie/Ledger) or old_world (football/metal). */
function classifyResult(text: string): 'covenant' | 'old_world' | null {
  const t = text.toLowerCase();
  const covenant = /\b(vitalie|pure\s*freedom|ledger|architect|covenant|vitality\s*digital\s*money|pff\s*foundation|era\s*of\s*light)\b/i.test(t);
  const oldWorldPff = /\b(football|soccer|premier\s*league|pff\s*(focus|rating|grade)|striker|midfielder|transfer)\b/i.test(t);
  const oldWorldVdm = /\b(vdm\s*metal|vanadium|steel\s*company|metallurgy|vdm\s*gmbh|metal\s*group|alloy)\b/i.test(t);
  if (covenant) return 'covenant';
  if (oldWorldPff || oldWorldVdm) return 'old_world';
  return null;
}

/** Clarification protocol: if PFF/VDM returns both covenant and old-world results, Governor asks which path. */
function checkClarificationNeeded(
  organic: SerperOrganic[],
  query: string
): { categoryA: string; categoryB: string } | null {
  const q = query.trim().toUpperCase();
  const isPff = q === 'PFF' || /^PFF\s*$/i.test(query.trim());
  const isVdm = q === 'VDM' || /^VDM\s*$/i.test(query.trim());
  if (!isPff && !isVdm) return null;
  const top = organic.slice(0, 5);
  let hasCovenant = false;
  let hasOldWorld = false;
  for (const o of top) {
    const text = [o.title, o.snippet].filter(Boolean).join(' ');
    const c = classifyResult(text);
    if (c === 'covenant') hasCovenant = true;
    if (c === 'old_world') hasOldWorld = true;
  }
  if (!hasCovenant || !hasOldWorld) return null;
  if (isPff) return { categoryA: "Old World's football and ratings", categoryB: "Covenant's Pure Freedom Foundation and the World of Vitalie" };
  return { categoryA: "Old World's metals and industry", categoryB: "Covenant's Vitality Digital Money and the Ledger" };
}

/**
 * Serper search: raw fetch only. Uses anchored + localized query. Returns result and organic for clarification check.
 */
async function searchDigitalArchivesSerper(
  name: string,
  country?: string
): Promise<{ result: SovereignRecognitionResult; organic: SerperOrganic[] } | null> {
  const apiKey = typeof process !== 'undefined' ? (process.env.SERPER_API_KEY ?? '').trim() : '';
  if (!apiKey) return null;
  const anchored = anchorSearchQuery(name);
  const localized = localizeQuery(anchored, country);
  const query = `${localized} LinkedIn OR Twitter OR site:linkedin.com OR site:twitter.com OR site:x.com`;
  try {
    const res = await fetch(SERPER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[sovereign-recognition] Serper API error:', res.status, res.statusText, body || '(no body)');
      return null;
    }
    const data = (await res.json()) as SerperResponse;
    const kg = data.knowledgeGraph;
    const organic = data.organic ?? [];
    const first = organic[0];
    const role = kg?.title ?? (first?.title?.split(/[-|·]/)[0]?.trim()) ?? 'Builder';
    const location = kg?.attributes?.['Location'] ?? kg?.attributes?.['Born'] ?? first?.snippet?.match(/\b(?:Lagos|Abuja|London|Paris|New York|Dubai|Accra|Nairobi|Berlin)\b/i)?.[0] ?? 'the Vanguard';
    const keyInterest = kg?.description?.slice(0, 80) ?? first?.snippet?.slice(0, 100) ?? 'the Protocol';
    const detail = first?.snippet ?? (kg?.description ? `From the archives: ${kg.description.slice(0, 120)}.` : undefined);
    const displayName = name.trim() || 'Citizen';
    const result: SovereignRecognitionResult = {
      name: displayName,
      role,
      location,
      keyInterest,
      detail: detail ?? undefined,
    };
    return { result, organic };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
    console.error('[sovereign-recognition] Search tool fetch failed:', msg, code ?? '');
    return null;
  }
}

/** Suggested lang from country: France→fr, Nigeria→leave to client (Pidgin/Yoruba/Igbo). */
function suggestedLangFromCountry(country: string | undefined): string | undefined {
  if (country === 'FR') return 'fr';
  if (country === 'NG') return 'ng'; // Client treats as "offer Pidgin, Yoruba, Igbo"
  return undefined;
}

/** Call Tavily to scan digital archives (fallback when Serper fails). Uses process.env.TAVILY_API_KEY. */
async function searchDigitalArchivesTavily(name: string, country?: string): Promise<SovereignRecognitionResult | null> {
  const apiKey = typeof process !== 'undefined' ? process.env.TAVILY_API_KEY?.trim() : '';
  if (!apiKey) return null;
  const anchored = anchorSearchQuery(name);
  const localized = localizeQuery(anchored, country);
  const query = `${localized} LinkedIn OR Twitter OR profile`;
  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, max_results: 5, search_depth: 'basic' }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[sovereign-recognition] Tavily API error:', res.status, res.statusText, body || '(no body)');
      return null;
    }
    const data = (await res.json()) as TavilyResponse;
    const results = data.results ?? [];
    const first = results[0];
    const snippet = first?.content ?? data.answer ?? '';
    const displayName = name.trim() || 'Citizen';
    const role = first?.title?.split(/[-|·]/)[0]?.trim() ?? 'Builder';
    const location = snippet.match(/\b(?:Lagos|Abuja|London|Paris|New York|Dubai|Accra|Nairobi|Berlin)\b/i)?.[0] ?? 'the Vanguard';
    const keyInterest = snippet.slice(0, 100) || 'the Protocol';
    const detail = snippet ? snippet.slice(0, 160) : undefined;
    return {
      name: displayName,
      role,
      location,
      keyInterest,
      detail,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sovereign-recognition] Tavily fetch failed:', msg);
    return null;
  }
}

/**
 * Force search: if SERPER_API_KEY is present, we always attempt real fetch to serper.dev.
 * No internal mock, no sovereign pivot—when both Serper and Tavily fail, return 503 so the client shows "sight offline".
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SovereignRecognitionPayload;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const country = getCountryFromRequest(request);
    const suggestedLang = suggestedLangFromCountry(country);

    if (hasSerperSight()) {
      const out = await searchDigitalArchivesSerper(name, country);
      if (out) {
        const { result, organic } = out;
        const clarification = checkClarificationNeeded(organic, name);
        if (clarification) {
          const payload: SovereignClarificationPayload = {
            clarificationRequired: true,
            query: name,
            categoryA: clarification.categoryA,
            categoryB: clarification.categoryB,
            country,
            suggestedLang,
          };
          return NextResponse.json(payload);
        }
        const filtered = filterIdentityResult({ ...result, country, suggestedLang }, name);
        return NextResponse.json({ ...filtered, country, suggestedLang });
      }
    }
    if (hasTavilySight()) {
      const result = await searchDigitalArchivesTavily(name, country);
      if (result) {
        const filtered = filterIdentityResult({ ...result, country, suggestedLang }, name);
        return NextResponse.json({ ...filtered, country, suggestedLang });
      }
    }
    return NextResponse.json(
      { error: 'SIGHT_OFFLINE', message: 'Search services unavailable. Check SERPER_API_KEY / TAVILY_API_KEY and console.' },
      { status: 503 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
