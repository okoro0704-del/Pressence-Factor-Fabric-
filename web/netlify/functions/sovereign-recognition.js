/**
 * Netlify Function: Sovereign Recognition (SOVRYN search).
 * Contextual anchoring: PFF/VDM queries get "Vitalie" or "Vitality Digital Money" appended.
 * Identity filtering: football/metal results trigger sovereign reframe (client shows Governor message).
 */

const SERPER_URL = 'https://google.serper.dev/search';
const TAVILY_URL = 'https://api.tavily.com/search';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function anchorSearchQuery(name) {
  const t = (name || '').trim().toUpperCase();
  if (t === 'PFF' || /^PFF\s*$/i.test((name || '').trim())) return (name || '').trim() + ' Vitalie Pure Freedom Foundation';
  if (t === 'VDM' || /^VDM\s*$/i.test((name || '').trim())) return (name || '').trim() + ' Vitality Digital Money Ledger Architect';
  return (name || '').trim();
}

function getCountryFromRequest(event) {
  const h = event.headers || {};
  const get = (k) => h[k] || h[k.toLowerCase()];
  const code = get('x-vercel-ip-country') || get('cf-ipcountry') || get('x-nf-request-country') || get('x-country-code') || '';
  const c = (code || '').trim().toUpperCase();
  return c.length === 2 ? c : undefined;
}

function localizeQuery(queryBase, country) {
  if (country === 'NG') return queryBase + ' Nigeria';
  return queryBase;
}

function suggestedLangFromCountry(country) {
  if (country === 'FR') return 'fr';
  if (country === 'NG') return 'ng';
  return undefined;
}

function classifyResult(text) {
  const t = (text || '').toLowerCase();
  if (/\b(vitalie|pure\s*freedom|ledger|architect|covenant|vitality\s*digital\s*money|pff\s*foundation|era\s*of\s*light)\b/i.test(t)) return 'covenant';
  if (/\b(football|soccer|premier\s*league|pff\s*(focus|rating|grade)|striker|midfielder|transfer)\b/i.test(t)) return 'old_world';
  if (/\b(vdm\s*metal|vanadium|steel\s*company|metallurgy|vdm\s*gmbh|metal\s*group|alloy)\b/i.test(t)) return 'old_world';
  return null;
}

function checkClarificationNeeded(organic, query) {
  const q = (query || '').trim().toUpperCase();
  const isPff = q === 'PFF' || /^PFF\s*$/i.test((query || '').trim());
  const isVdm = q === 'VDM' || /^VDM\s*$/i.test((query || '').trim());
  if (!isPff && !isVdm) return null;
  const top = (organic || []).slice(0, 5);
  let hasCovenant = false, hasOldWorld = false;
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

function filterIdentityResult(result, originalQuery) {
  const combined = [result.role, result.keyInterest, result.detail].filter(Boolean).join(' ').toLowerCase();
  const isFootball = /\b(football|soccer|premier\s*league|pff\s*(focus|rating|grade)|striker|midfielder|league\s*table|transfer)\b/i.test(combined);
  const isMetal = /\b(vdm\s*metal|vanadium|steel\s*company|metallurgy|vdm\s*gmbh|metal\s*group|alloy)\b/i.test(combined);
  if (isFootball && /pff|pure\s*freedom/i.test(originalQuery)) {
    return { ...result, sovereignReframe: true, reframeTerm: 'PFF', detail: undefined };
  }
  if (isMetal && /vdm/i.test(originalQuery)) {
    return { ...result, sovereignReframe: true, reframeTerm: 'VDM', detail: undefined };
  }
  return result;
}

async function searchSerper(name, country) {
  const apiKey = (process.env.SERPER_API_KEY || '').trim();
  if (!apiKey) return null;
  const anchored = anchorSearchQuery(name);
  const localized = localizeQuery(anchored, country);
  const query = `${localized} LinkedIn OR Twitter OR site:linkedin.com OR site:twitter.com OR site:x.com`;
  try {
    const res = await fetch(SERPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: query, num: 8 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const kg = data.knowledgeGraph || {};
    const organic = data.organic || [];
    const first = organic[0] || {};
    const locationMatch = (first.snippet || '').match(/\b(?:Lagos|Abuja|London|Paris|New York|Dubai|Accra|Nairobi|Berlin)\b/i);
    const result = {
      name: (name || 'Citizen').trim() || 'Citizen',
      role: kg.title || (first.title || '').split(/[-|·]/)[0]?.trim() || 'Builder',
      location: kg.attributes?.Location || kg.attributes?.Born || (locationMatch && locationMatch[0]) || 'the Vanguard',
      keyInterest: (kg.description || first.snippet || '').slice(0, 80) || 'the Protocol',
      detail: first.snippet || (kg.description ? `From the archives: ${kg.description.slice(0, 120)}.` : undefined),
    };
    return { result, organic };
  } catch {
    return null;
  }
}

async function searchTavily(name, country) {
  const apiKey = (process.env.TAVILY_API_KEY || '').trim();
  if (!apiKey) return null;
  const anchored = anchorSearchQuery(name);
  const localized = localizeQuery(anchored, country);
  const query = `${localized} LinkedIn OR Twitter OR profile`;
  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, max_results: 5, search_depth: 'basic' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    const first = results[0] || {};
    const snippet = first.content || data.answer || '';
    const locationMatch = snippet.match(/\b(?:Lagos|Abuja|London|Paris|New York|Dubai|Accra|Nairobi|Berlin)\b/i);
    return {
      name: (name || 'Citizen').trim() || 'Citizen',
      role: (first.title || '').split(/[-|·]/)[0]?.trim() || 'Builder',
      location: (locationMatch && locationMatch[0]) || 'the Vanguard',
      keyInterest: snippet.slice(0, 100) || 'the Protocol',
      detail: snippet ? snippet.slice(0, 160) : undefined,
    };
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'name is required' }),
    };
  }

  const country = getCountryFromRequest(event);
  const suggestedLang = suggestedLangFromCountry(country);

  const serperOut = await searchSerper(name, country);
  if (serperOut) {
    const { result, organic } = serperOut;
    const clarification = checkClarificationNeeded(organic, name);
    if (clarification) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          clarificationRequired: true,
          query: name,
          categoryA: clarification.categoryA,
          categoryB: clarification.categoryB,
          country,
          suggestedLang,
        }),
      };
    }
    const filtered = filterIdentityResult({ ...result, country, suggestedLang }, name);
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ...filtered, country, suggestedLang }),
    };
  }

  const tavilyResult = await searchTavily(name, country);
  if (tavilyResult) {
    const filtered = filterIdentityResult({ ...tavilyResult, country, suggestedLang }, name);
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ...filtered, country, suggestedLang }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({
      status: 'archival_breach_in_progress',
      name: (name || 'Citizen').trim() || 'Citizen',
      role: 'Citizen',
      location: 'the Vanguard',
      keyInterest: 'the Protocol',
      detail: undefined,
      country,
      suggestedLang,
      message: 'Archival breach in progress. SOVRYN responds from the Covenant.',
    }),
  };
};
