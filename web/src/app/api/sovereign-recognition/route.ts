/**
 * Sovereign Recognition (Social Sync) API.
 * Accepts a name and returns a profile from "digital archives" (public OSINT).
 *
 * Env: SERPER_API_KEY from process.env. If present, we must attempt a real fetch to serper.dev.
 * No internal mock or sovereign pivot when search is requested—if both Serper and Tavily fail, we return 503.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

// Diagnostic: at route load, log whether SERPER_API_KEY is present (check terminal).
console.log('SOVRYN Sight Check: ', process.env.SERPER_API_KEY ? 'ONLINE' : 'OFFLINE');

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
 * Serper search: raw fetch only (no library wrapper). URL and header must match .env key SERPER_API_KEY.
 * https://google.serper.dev/search — X-API-KEY: process.env.SERPER_API_KEY
 */
async function searchDigitalArchivesSerper(name: string): Promise<SovereignRecognitionResult | null> {
  const apiKey = typeof process !== 'undefined' ? (process.env.SERPER_API_KEY ?? '').trim() : '';
  if (!apiKey) return null;
  const query = `${name} LinkedIn OR Twitter OR site:linkedin.com OR site:twitter.com OR site:x.com`;
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
    return {
      name: displayName,
      role,
      location,
      keyInterest,
      detail: detail ?? undefined,
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

    if (hasSerperSight()) {
      const result = await searchDigitalArchivesSerper(name);
      if (result) return NextResponse.json(result);
    }
    if (hasTavilySight()) {
      const result = await searchDigitalArchivesTavily(name);
      if (result) return NextResponse.json(result);
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
