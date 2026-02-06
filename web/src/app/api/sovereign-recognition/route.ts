/**
 * Sovereign Recognition (Social Sync) API.
 * Accepts a name and returns a simulated profile from "digital archives" (public OSINT).
 *
 * Integration point: Replace the mock below with:
 * - Google Custom Search API restricted to site:linkedin.com OR site:twitter.com OR site:x.com OR site:instagram.com
 * - Or an OSINT/social-aggregator API that returns public bio, role, location, interests.
 *
 * Response is used by the Companion to deliver the "I see you, [Name]..." Wow moment.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CompanionLangCode } from '@/lib/manifestoCompanionKnowledge';

export const dynamic = 'force-static';

export interface SovereignRecognitionPayload {
  name: string;
  lang?: CompanionLangCode | null;
}

export interface SovereignRecognitionResult {
  name: string;
  role: string;
  location: string;
  keyInterest: string;
}

/** Simulate a short scan delay (replace with real API call when integrating OSINT/Google Search). */
const SCAN_DELAY_MS = 1800;

/**
 * Mock: derive a plausible-looking profile from the name only.
 * In production, call an OSINT or Google Custom Search API restricted to social domains,
 * parse LinkedIn/Twitter/Instagram bios and recent activity, then return role, location, keyInterest.
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
  return {
    name: trimmed,
    role: roles[hash % roles.length],
    location: locations[(hash + 1) % locations.length],
    keyInterest: interests[(hash + 2) % interests.length],
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

    // Simulate scan time (replace with real API call)
    await new Promise((r) => setTimeout(r, SCAN_DELAY_MS));

    const result = mockSearchDigitalArchives(name);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
