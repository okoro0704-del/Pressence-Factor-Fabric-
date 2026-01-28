/**
 * PFF Backend — The Living Record.
 * AES-256 field-level encryption. Decryption gated by real-time Presence Proof.
 */

import * as crypto from 'crypto';
import { query } from '../db/client';
import { encryptField, decryptField } from './crypto';
import { verifyHandshake } from '../lib/verifyHandshake';
import type { SignedPresenceProof } from '../types';

const HEARTBEAT_FRESHNESS_MS = 60_000;

export interface LivingRecordFields {
  medical?: Record<string, unknown>;
  financial?: Record<string, unknown>;
}

export async function getEncrypted(
  citizenId: string
): Promise<{
  encryptedMedical: string | null;
  encryptedFinancial: string | null;
  ivMedical: string | null;
  ivFinancial: string | null;
  authTagMedical: string | null;
  authTagFinancial: string | null;
} | null> {
  const { rows } = await query<{
    encrypted_medical: string | null;
    encrypted_financial: string | null;
    iv_medical: string | null;
    iv_financial: string | null;
    auth_tag_medical: string | null;
    auth_tag_financial: string | null;
  }>(
    `SELECT encrypted_medical, encrypted_financial, iv_medical, iv_financial, auth_tag_medical, auth_tag_financial
     FROM the_living_record WHERE citizen_id = $1`,
    [citizenId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    encryptedMedical: r.encrypted_medical,
    encryptedFinancial: r.encrypted_financial,
    ivMedical: r.iv_medical,
    ivFinancial: r.iv_financial,
    authTagMedical: r.auth_tag_medical,
    authTagFinancial: r.auth_tag_financial,
  };
}

export async function upsertEncrypted(
  citizenId: string,
  fields: LivingRecordFields
): Promise<void> {
  let encMedical: ReturnType<typeof encryptField> | null = null;
  let encFinancial: ReturnType<typeof encryptField> | null = null;
  if (fields.medical != null) {
    encMedical = encryptField(JSON.stringify(fields.medical));
  }
  if (fields.financial != null) {
    encFinancial = encryptField(JSON.stringify(fields.financial));
  }

  await query(
    `INSERT INTO the_living_record (citizen_id, encrypted_medical, encrypted_financial, iv_medical, iv_financial, auth_tag_medical, auth_tag_financial, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (citizen_id) DO UPDATE SET
       encrypted_medical = COALESCE(EXCLUDED.encrypted_medical, the_living_record.encrypted_medical),
       encrypted_financial = COALESCE(EXCLUDED.encrypted_financial, the_living_record.encrypted_financial),
       iv_medical = COALESCE(EXCLUDED.iv_medical, the_living_record.iv_medical),
       iv_financial = COALESCE(EXCLUDED.iv_financial, the_living_record.iv_financial),
       auth_tag_medical = COALESCE(EXCLUDED.auth_tag_medical, the_living_record.auth_tag_medical),
       auth_tag_financial = COALESCE(EXCLUDED.auth_tag_financial, the_living_record.auth_tag_financial),
       updated_at = NOW()`,
    [
      citizenId,
      encMedical?.encrypted ?? null,
      encFinancial?.encrypted ?? null,
      encMedical?.iv ?? null,
      encFinancial?.iv ?? null,
      encMedical?.authTag ?? null,
      encFinancial?.authTag ?? null,
    ]
  );
}

/**
 * Decrypt only after verifying a fresh Presence Proof (Heartbeat).
 * Returns { citizenId, medical, financial } or { error }.
 */
export async function decryptWithProof(
  signedProof: SignedPresenceProof
): Promise<
  | { citizenId: string; medical?: Record<string, unknown>; financial?: Record<string, unknown> }
  | { error: string }
> {
  const result = await verifyHandshake(signedProof);
  if (!result.ok) {
    return { error: result.message };
  }
  const age = Date.now() - signedProof.payload.timestamp;
  if (age > HEARTBEAT_FRESHNESS_MS) {
    return { error: 'Presence Proof too old; real-time Heartbeat required for decrypt' };
  }

  const rec = await getEncrypted(result.citizenId);
  const out: LivingRecordFields = {};
  if (rec) {
    if (rec.encryptedMedical && rec.ivMedical && rec.authTagMedical) {
      try {
        out.medical = JSON.parse(
          decryptField(rec.encryptedMedical, rec.ivMedical, rec.authTagMedical)
        ) as Record<string, unknown>;
      } catch {
        out.medical = {};
      }
    }
    if (rec.encryptedFinancial && rec.ivFinancial && rec.authTagFinancial) {
      try {
        out.financial = JSON.parse(
          decryptField(rec.encryptedFinancial, rec.ivFinancial, rec.authTagFinancial)
        ) as Record<string, unknown>;
      } catch {
        out.financial = {};
      }
    }
  }
  return { citizenId: result.citizenId, ...out };
}

function integrityHash(citizenId: string, action: string): string {
  return crypto
    .createHash('sha256')
    .update(citizenId + action + Date.now())
    .digest('hex');
}

export async function logAccess(
  citizenIdRef: string,
  action: 'decrypt_request' | 'decrypt_granted' | 'decrypt_denied'
): Promise<void> {
  await query(
    `INSERT INTO living_record_access_log (citizen_id_ref, action, integrity_hash) VALUES ($1, $2, $3)`,
    [citizenIdRef, action, integrityHash(citizenIdRef, action)]
  );
}
