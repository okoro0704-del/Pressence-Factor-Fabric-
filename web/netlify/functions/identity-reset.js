/**
 * Netlify Function: Hard Identity Reset — clear Supabase profile for this device.
 * POST body: { deviceId: string }
 * Clears primary_sentinel_device_id, face_hash, recovery_seed_hash, is_fully_verified for the
 * user_profiles row where primary_sentinel_device_id = deviceId; deletes sentinel_identities for that phone.
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

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
  if (!deviceId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: 'deviceId required' }),
    };
  }

  const supabase = createClient(url, anonKey);

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, phone_number')
      .eq('primary_sentinel_device_id', deviceId)
      .maybeSingle();

    if (fetchError) {
      console.error('[identity-reset] fetch:', fetchError);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: fetchError.message || 'Failed to find profile' }),
      };
    }

    if (!profile) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: true, message: 'No profile bound to this device' }),
      };
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: null,
        primary_sentinel_assigned_at: null,
        face_hash: null,
        recovery_seed_hash: null,
        is_fully_verified: false,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[identity-reset] update:', updateError);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, error: updateError.message || 'Failed to clear profile' }),
      };
    }

    const phone = profile.phone_number;
    if (phone) {
      await supabase.from('sentinel_identities').delete().eq('phone_number', phone);
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true, message: 'Device unlinked; ready for re-registration' }),
    };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[identity-reset]', msg);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, error: msg }),
    };
  }
};
