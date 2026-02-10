/**
 * Netlify Function: GET /api/v1/vitalization-status?phone=+234...
 * Returns backend vitalization status for the given phone (same contract as the removed Next route).
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (set in Netlify UI).
 */

const { createClient } = require('@supabase/supabase-js');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      statusCode: 503,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: 'Supabase not configured' }),
    };
  }

  const phone = (event.queryStringParameters?.phone ?? '').trim();
  if (!phone) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({
        ok: false,
        error: 'Missing phone. Use: /api/v1/vitalization-status?phone=+234XXXXXXXXXX',
      }),
    };
  }

  const supabase = createClient(url, anonKey);

  try {
    const { data, error } = await supabase.rpc('get_vitalization_status', { p_phone: phone });

    if (error) {
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: error.message || 'RPC failed' }),
      };
    }

    const out = data ?? {};

    if (out.ok === false) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: out.error || 'Unknown error' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(out),
    };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[vitalization-status]', msg);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: msg }),
    };
  }
};
