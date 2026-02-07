/**
 * Netlify Function: Sovereign Recognition (SOVRYN search).
 * POST body: { name: string, lang?: string }
 * Uses SERPER_API_KEY then TAVILY_API_KEY. Returns 503 if both fail.
 * Deploy with redirect: /api/sovereign-recognition -> this function.
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

async function searchSerper(name) {
  const apiKey = (process.env.SERPER_API_KEY || '').trim();
  if (!apiKey) return null;
  const query = `${name} LinkedIn OR Twitter OR site:linkedin.com OR site:twitter.com OR site:x.com`;
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
    return {
      name: (name || 'Citizen').trim() || 'Citizen',
      role: kg.title || (first.title || '').split(/[-|·]/)[0]?.trim() || 'Builder',
      location: kg.attributes?.Location || kg.attributes?.Born || (locationMatch && locationMatch[0]) || 'the Vanguard',
      keyInterest: (kg.description || first.snippet || '').slice(0, 80) || 'the Protocol',
      detail: first.snippet || (kg.description ? `From the archives: ${kg.description.slice(0, 120)}.` : undefined),
    };
  } catch {
    return null;
  }
}

async function searchTavily(name) {
  const apiKey = (process.env.TAVILY_API_KEY || '').trim();
  if (!apiKey) return null;
  const query = `${name} LinkedIn OR Twitter OR profile`;
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

  let result = await searchSerper(name);
  if (result) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result),
    };
  }
  result = await searchTavily(name);
  if (result) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result),
    };
  }

  return {
    statusCode: 503,
    headers: corsHeaders(),
    body: JSON.stringify({
      error: 'SIGHT_OFFLINE',
      message: 'Search services unavailable. Check SERPER_API_KEY / TAVILY_API_KEY in Netlify env.',
    }),
  };
};
