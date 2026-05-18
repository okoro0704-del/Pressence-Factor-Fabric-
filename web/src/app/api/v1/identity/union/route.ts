/**
 * Identity Union pipeline — TFAN network hardlock.
 * POST { action: 'stage-union' | 'seal-union', ... }
 *
 * stage-union: pre-stage face hash + WebAuthn challenge (no raw biometrics stored).
 * seal-union: Merkle seal (face + device), persist sovereign_root, device_anchors, clear staging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  normalizeBiometricToFaceHash,
  randomChallengeHex,
  resolveRpId,
  sha256Hex,
} from '@/lib/identityUnionServer';
import { generateMerkleRootFaceDevice } from '@/lib/merkleRoot';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action.trim() : '';

  if (action === 'stage-union') {
    return handleStageUnion(request, supabase, body);
  }
  if (action === 'seal-union') {
    return handleSealUnion(supabase, body);
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}

async function handleStageUnion(
  request: NextRequest,
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  body: Record<string, unknown>
) {
  const rawPhone = typeof body.rawPhoneNumber === 'string' ? body.rawPhoneNumber.trim() : '';
  const rawBiometric =
    typeof body.rawBiometricString === 'string' ? body.rawBiometricString.trim() : '';
  const rawDeviceId = typeof body.rawDeviceId === 'string' ? body.rawDeviceId.trim() : '';

  if (!rawPhone || !rawBiometric || !rawDeviceId) {
    return NextResponse.json(
      { ok: false, error: 'rawPhoneNumber, rawBiometricString, rawDeviceId required' },
      { status: 400 }
    );
  }

  let faceHash: string;
  try {
    faceHash = await normalizeBiometricToFaceHash(rawBiometric);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid biometric input' }, { status: 400 });
  }

  const challengeHex = randomChallengeHex(32);
  const rpId = resolveRpId(
    request.headers.get('host'),
    request.headers.get('x-forwarded-host')
  );

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('stage_identity_union', {
    p_phone_number: rawPhone,
    p_face_hash: faceHash,
    p_device_id: rawDeviceId,
    p_challenge_hex: challengeHex,
    p_ttl_seconds: 600,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Stage union failed' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string; registration_challenge?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'Stage union RPC failed' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    registrationChallenge: out.registration_challenge ?? challengeHex,
    rpId,
  });
}

async function handleSealUnion(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  body: Record<string, unknown>
) {
  const tfanNumber = typeof body.tfanNumber === 'string' ? body.tfanNumber.trim() : '';
  const credentialId = typeof body.credentialId === 'string' ? body.credentialId.trim() : '';
  const hardwarePublicKey =
    typeof body.hardwarePublicKey === 'string' ? body.hardwarePublicKey.trim() : '';

  if (!tfanNumber || !credentialId) {
    return NextResponse.json(
      { ok: false, error: 'tfanNumber and credentialId required' },
      { status: 400 }
    );
  }

  const { data: stagingRows, error: stagingError } = await (supabase as any)
    .from('identity_union_staging')
    .select('face_hash, device_id, challenge_hex')
    .eq('phone_number', tfanNumber)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (stagingError) {
    return NextResponse.json(
      { ok: false, error: stagingError.message ?? 'Staging lookup failed' },
      { status: 400 }
    );
  }

  const staging = stagingRows?.[0] as
    | { face_hash: string; device_id: string; challenge_hex: string }
    | undefined;
  if (!staging?.face_hash) {
    return NextResponse.json(
      { ok: false, error: 'No active identity union staging for this phone. Run stage-union first.' },
      { status: 400 }
    );
  }

  const deviceHash = await sha256Hex(credentialId);
  let sovereignRoot: string;
  try {
    sovereignRoot = await generateMerkleRootFaceDevice(staging.face_hash, deviceHash);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Merkle root failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const credentialIdHash = await sha256Hex(credentialId);

  const { data: sealData, error: sealError } = await (supabase as any).rpc('seal_identity_union', {
    p_phone_number: tfanNumber,
    p_face_hash: staging.face_hash,
    p_device_id: staging.device_id,
    p_sovereign_root: sovereignRoot,
    p_credential_id_hash: credentialIdHash,
  });

  if (sealError) {
    return NextResponse.json(
      { ok: false, error: sealError.message ?? 'Seal union failed' },
      { status: 400 }
    );
  }

  const sealOut = (sealData ?? {}) as { ok?: boolean; error?: string };
  if (sealOut.ok !== true) {
    return NextResponse.json({ ok: false, error: sealOut.error ?? 'Seal RPC failed' }, { status: 400 });
  }

  const keyId = `webauthn-${credentialIdHash.slice(0, 16)}`;
  await (supabase as any).rpc('set_citizen_root', {
    p_device_id: staging.device_id,
    p_key_id: keyId,
    p_citizen_root: sovereignRoot,
  });

  return NextResponse.json({
    ok: true,
    success: true,
    sovereignRoot,
    deviceHardlocked: true,
    hardwarePublicKeyStored: hardwarePublicKey.length > 0,
  });
}
