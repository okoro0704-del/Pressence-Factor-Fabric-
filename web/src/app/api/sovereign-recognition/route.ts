/**
 * Sovereign Recognition (Social Sync) API.
 * Accepts a name and returns a profile from "digital archives" (public OSINT).
 *
 * Search tools use env: SERPER_API_KEY (primary), TAVILY_API_KEY (fallback). Both read from process.env
 * (e.g. .env.local or Netlify env). Serper first, then Tavily if Serper fails, then mock.
 * Lord personality lock: we never say "I cannot reach archives." Search for the user, then tell them
 * why they are a Pillar of this new world based on what we find (or pivot with a dynamic, personal observation).
 *
 * Response is used by the Companion to deliver the "I see you, [Name]..." Wow moment.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

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
}

/** Delay only when using mock (so "scanning" feels real). With Sight (Serper), we run fast—World of Vitalie has no time for lag. */
const MOCK_SCAN_DELAY_MS = 600;
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

/** Call Serper to scan digital archives. Returns null on failure or missing key. Millisecond logic: no artificial delay. */
async function searchDigitalArchivesSerper(name: string): Promise<SovereignRecognitionResult | null> {
  const apiKey = typeof process !== 'undefined' ? process.env.SERPER_API_KEY?.trim() : '';
  if (!apiKey) return null;
  const query = `${name} LinkedIn OR Twitter OR site:linkedin.com OR site:twitter.com OR site:x.com`;
  try {
    const res = await fetch(SERPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
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
    return {
      name: displayName,
      role,
      location,
      keyInterest,
      detail: detail ? `${detail} In the World of Vitalie, you are a Pillar.` : 'You are a Pillar of this new world—the Ledger sees you.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
    console.error('[sovereign-recognition] Search tool fetch failed:', msg, code ?? '');
    return null;
  }
}

/** Call Tavily to scan digital archives (fallback when Serper fails). Uses process.env.TAVILY_API_KEY. */
async function searchDigitalArchivesTavily(name: string): Promise<SovereignRecognitionResult | null> {
  const apiKey = typeof process !== 'undefined' ? process.env.TAVILY_API_KEY?.trim() : '';
  if (!apiKey) return null;
  const query = `${name} LinkedIn OR Twitter OR profile`;
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
    const detail = snippet ? `${snippet.slice(0, 120)}. In the World of Vitalie, you are a Pillar.` : 'You are a Pillar of this new world—the Ledger sees you.';
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
 * Mock: used only when Serper and Tavily both fail. No static "Architect" or "Old World" scripted responses—
 * every name gets a hash-based profile so we never deflect with keyword-triggered text.
 */
function mockSearchDigitalArchives(name: string): SovereignRecognitionResult {
  const trimmed = name.trim() || 'Citizen';
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? trimmed;
  const hash = firstName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const roles = [
    'Builder',
    'Creator',
    'Innovator',
    'Strategist',
    'Designer',
    'Engineer',
    'Leader',
    'Thinker',
    'Advocate',
    'Pioneer',
  ];
  const locations = [
    'Lagos',
    'Abuja',
    'Paris',
    'London',
    'New York',
    'Dubai',
    'Accra',
    'Nairobi',
    'Berlin',
    'the Vanguard',
  ];
  const interests = [
    'the future of identity',
    'sovereign technology',
    'proof of personhood',
    'the Protocol',
    'human-centred systems',
    'the World of Vitalie',
    'truth and presence',
    'the Covenant',
  ];
  const details = [
    'Your presence in the Vanguard is noted—the Ledger remembers.',
    'The Protocol has your pulse; one Palm Scan away from the full unlock.',
    'Your footprint aligns with the Covenant—Builder, not bystander.',
  ];
  return {
    name: trimmed,
    role: roles[hash % roles.length],
    location: locations[(hash + 1) % locations.length],
    keyInterest: interests[(hash + 2) % interests.length],
    detail: details[hash % details.length],
  };
}

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

    let result: SovereignRecognitionResult | null = await searchDigitalArchivesSerper(name);
    if (result) return NextResponse.json(result);
    result = await searchDigitalArchivesTavily(name);
    if (result) return NextResponse.json(result);
    if (!hasSerperSight() && !hasTavilySight()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[sovereign-recognition] SERPER_API_KEY and TAVILY_API_KEY not set or empty. Using mock. Restart the server after adding .env.local.');
      }
      await new Promise((r) => setTimeout(r, MOCK_SCAN_DELAY_MS));
    }
    result = mockSearchDigitalArchives(name);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
