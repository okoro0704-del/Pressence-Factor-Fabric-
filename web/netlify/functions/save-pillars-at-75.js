/**
 * Netlify Function: POST /api/v1/save-pillars-at-75
 * Save pillars at 75% (Face, Palm, Device) and set vitalization_status = VITALIZED.
 * Body: { phone_number, face_hash, palm_hash, device_id }
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
  const face_hash = typeof body.face_hash === 'string' ? body.face_hash.trim() : '';
  const palm_hash = typeof body.palm_hash === 'string' ? body.palm_hash.trim() : '';
  const device_id = typeof body.device_id === 'string' ? body.device_id.trim() : '';

  if (!phone_number || !face_hash || !palm_hash || !device_id) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({
        ok: false,
        error: 'phone_number, face_hash, palm_hash, device_id required',
      }),
    };
  }

  const supabase = createClient(url, anonKey);

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_pillars_at_75', {
      p_phone_number: phone_number,
      p_face_hash: face_hash,
      p_palm_hash: palm_hash,
      p_device_id: device_id,
    });

    if (rpcError) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: rpcError.message || 'Failed to save pillars' }),
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
      body: JSON.stringify({ ok: true, action: out.action || 'saved' }),
    };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[save-pillars-at-75]', msg);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: msg }),
    };
  }
};
