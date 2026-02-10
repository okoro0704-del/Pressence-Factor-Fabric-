/**
 * Netlify Function: POST /api/v1/save-sovereign-root
 * Save sovereign (Merkle) root to user_profiles by phone. Call after generateSovereignRoot().
 * Body: { phone_number, sovereign_root }
 * Static export has no Next.js API routes; this function is used when deployed on Netlify.
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

  if (event.httpMethod !== 'POST') {
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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    };
  }

  const phone_number = typeof body.phone_number === 'string' ? body.phone_number.trim() : '';
  const sovereign_root = typeof body.sovereign_root === 'string' ? body.sovereign_root.trim() : '';

  if (!phone_number || !sovereign_root) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({
        ok: false,
        error: 'phone_number and sovereign_root required',
      }),
    };
  }

  const supabase = createClient(url, anonKey);

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_profile_sovereign_root', {
      p_phone_number: phone_number,
      p_sovereign_root: sovereign_root,
    });

    if (rpcError) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: rpcError.message || 'Failed to save sovereign root' }),
      };
    }

    const out = rpcData ?? {};
    if (out.ok !== true) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: out.error || 'RPC failed' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true, updated: true }),
    };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[save-sovereign-root]', msg);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: msg }),
    };
  }
};
