/**
 * Sentinel Licensing & Tiered Revenue Engine.
 * License persistence in sentinel_licenses; device fingerprinting; payments in sentinel_business_ledger.
 * $400 and $1000 tiers unlock PFF_API_KEY for business integration.
 */

import { supabase } from './supabase';
import { getCurrentDeviceInfo } from './multiDeviceVitalization';

function generatePffApiKey(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return 'pff_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'pff_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 18);
}

export const SENTINEL_TIERS = {
  TIER_20: { priceUsd: 20, maxDevices: 1, label: 'Citizen', businessApi: false },
  TIER_50: { priceUsd: 50, maxDevices: 3, label: 'Personal Multi', businessApi: false },
  TIER_400: { priceUsd: 400, maxDevices: 5, label: 'Business', businessApi: true },
  TIER_1000: { priceUsd: 1000, maxDevices: 15, label: 'Enterprise', businessApi: true },
} as const;

export type SentinelTierType = keyof typeof SENTINEL_TIERS;

export interface SentinelLicenseRow {
  id: string;
  owner_id: string;
  tier_type: SentinelTierType;
  max_devices: number;
  expiry_date: string | null;
  pff_api_key: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SentinelBusinessLedgerRow {
  id: string;
  owner_id: string;
  tier_type: string;
  amount_usd: number;
  amount_dllr: number | null;
  reference: string | null;
  created_at: string;
}

/** Get active license for an IdentityAnchor (owner_id = phone). */
export async function getActiveLicense(ownerId: string): Promise<SentinelLicenseRow | null> {
  if (!ownerId || !supabase) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('sentinel_licenses')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const expiry = row.expiry_date as string | null;
    const isExpired = expiry ? new Date(expiry).getTime() < Date.now() : false;
    if (isExpired) return null;
    return {
      id: row.id as string,
      owner_id: row.owner_id as string,
      tier_type: row.tier_type as SentinelTierType,
      max_devices: Number(row.max_devices ?? 0),
      expiry_date: expiry,
      pff_api_key: (row.pff_api_key as string) ?? null,
      status: row.status as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  } catch {
    return null;
  }
}

/** Whether the user has an active Sentinel License (required for Wallet / Partner API access). */
export async function hasActiveSentinelLicense(ownerId: string): Promise<boolean> {
  const license = await getActiveLicense(ownerId);
  return !!license;
}

/** Count devices currently linked to a license. */
async function countLicenseDevices(licenseId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await (supabase as any)
    .from('sentinel_license_devices')
    .select('id', { count: 'exact', head: true })
    .eq('license_id', licenseId);
  if (error) return 0;
  return count ?? 0;
}

/** Link current device (hardware UUID) to the user's license. Fails if max_devices reached. */
export async function linkDeviceToLicense(
  ownerId: string,
  deviceUuid?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ownerId || !supabase) return { ok: false, error: 'Owner or Supabase not available' };
  const license = await getActiveLicense(ownerId);
  if (!license) return { ok: false, error: 'No active Sentinel license' };
  const uuid = deviceUuid ?? (typeof window !== 'undefined' ? getCurrentDeviceInfo().deviceId : '');
  if (!uuid) return { ok: false, error: 'No device UUID' };
  const current = await countLicenseDevices(license.id);
  if (current >= license.max_devices) {
    return { ok: false, error: `License allows ${license.max_devices} device(s). Maximum reached.` };
  }
  try {
    const { error } = await (supabase as any)
      .from('sentinel_license_devices')
      .upsert(
        { license_id: license.id, device_uuid: uuid, bound_at: new Date().toISOString() },
        { onConflict: 'license_id,device_uuid' }
      );
    if (error) return { ok: false, error: error.message ?? 'Failed to link device' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Check if current device is linked to the user's license. */
export async function isCurrentDeviceLinked(ownerId: string): Promise<boolean> {
  if (!ownerId || !supabase) return false;
  const license = await getActiveLicense(ownerId);
  if (!license) return false;
  const uuid = typeof window !== 'undefined' ? getCurrentDeviceInfo().deviceId : '';
  if (!uuid) return false;
  const { data, error } = await (supabase as any)
    .from('sentinel_license_devices')
    .select('id')
    .eq('license_id', license.id)
    .eq('device_uuid', uuid)
    .maybeSingle();
  return !error && !!data;
}

/**
 * Process Sentinel payment: record in sentinel_business_ledger (USD/DLLR),
 * create/update sentinel_licenses, link device, and for $400/$1000 unlock PFF_API_KEY.
 */
export async function processSentinelPayment(
  ownerId: string,
  tierType: SentinelTierType,
  amountUsd: number,
  amountDllr?: number,
  reference?: string
): Promise<{ ok: true; licenseId: string; pffApiKey?: string } | { ok: false; error: string }> {
  if (!ownerId || !supabase) return { ok: false, error: 'Owner or Supabase not available' };
  const tier = SENTINEL_TIERS[tierType];
  if (!tier || amountUsd < tier.priceUsd) {
    return { ok: false, error: `Invalid tier or amount. ${tierType} requires $${tier?.priceUsd ?? '?'}` };
  }
  try {
    await (supabase as any).from('sentinel_business_ledger').insert({
      owner_id: ownerId,
      tier_type: tierType,
      amount_usd: amountUsd,
      amount_dllr: amountDllr ?? null,
      reference: reference ?? null,
      created_at: new Date().toISOString(),
    });

    const pffApiKey = tier.businessApi ? generatePffApiKey() : null;
    const { data: licenseRow, error: licenseError } = await (supabase as any)
      .from('sentinel_licenses')
      .insert({
        owner_id: ownerId,
        tier_type: tierType,
        max_devices: tier.maxDevices,
        expiry_date: null,
        pff_api_key: pffApiKey,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (licenseError || !licenseRow) {
      return { ok: false, error: licenseError?.message ?? 'Failed to create license' };
    }
    const licenseId = (licenseRow as { id: string }).id;
    await linkDeviceToLicense(ownerId);
    return {
      ok: true,
      licenseId,
      ...(pffApiKey ? { pffApiKey } : {}),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
