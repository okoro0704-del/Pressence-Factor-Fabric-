/**
 * Sentinel Hub Plan Upgrade — Auto-debit from Spendable Vault to Sentinel.
 * POST body: { phone: string, planType: 'STANDARD' | 'FAMILY' | 'SMALL_BUSINESS' | 'ENTERPRISE' }
 * Updates user_profiles.device_limit and sentinel_plan_type; records in sentinel_business_ledger; creates/updates sentinel_licenses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  SENTINEL_HUB_PLANS,
  SPENDABLE_VAULT_USD,
  type SentinelHubPlanType,
} from '@/lib/sentinelHubPlans';

const VALID_PLANS: SentinelHubPlanType[] = ['STANDARD', 'FAMILY', 'SMALL_BUSINESS', 'ENTERPRISE'];

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({ ok: false, error: 'API not available during static export' }, { status: 503 });
  }
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { phone?: string; planType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').trim().replace(/\s/g, '');
  const planType = (body.planType ?? '').toUpperCase() as SentinelHubPlanType;

  if (!phone) {
    return NextResponse.json({ ok: false, error: 'phone required' }, { status: 400 });
  }
  if (!VALID_PLANS.includes(planType)) {
    return NextResponse.json({ ok: false, error: 'Invalid planType. Use STANDARD, FAMILY, SMALL_BUSINESS, or ENTERPRISE.' }, { status: 400 });
  }

  const plan = SENTINEL_HUB_PLANS[planType];
  if (plan.priceUsd > SPENDABLE_VAULT_USD) {
    return NextResponse.json({
      ok: false,
      error: `Insufficient Spendable balance. Plan costs $${plan.priceUsd}; Spendable Vault is $${SPENDABLE_VAULT_USD}.`,
    }, { status: 400 });
  }

  try {
    // 1) Record debit in sentinel_business_ledger (auto-debit from Spendable Vault to Sentinel)
    const { error: ledgerError } = await (supabase as any)
      .from('sentinel_business_ledger')
      .insert({
        owner_id: phone,
        tier_type: planType,
        amount_usd: plan.priceUsd,
        amount_dllr: null,
        reference: `Spendable Vault debit — ${plan.label} plan`,
        created_at: new Date().toISOString(),
      });
    if (ledgerError) {
      return NextResponse.json({ ok: false, error: ledgerError.message ?? 'Failed to record debit' }, { status: 500 });
    }

    // 2) Update user_profiles: device_limit, sentinel_plan_type
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .update({
        device_limit: plan.deviceLimit,
        sentinel_plan_type: planType,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phone);
    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message ?? 'Failed to update profile' }, { status: 500 });
    }

    // 3) Create or update sentinel_licenses: get existing ACTIVE license for owner
    const { data: existingLicense } = await (supabase as any)
      .from('sentinel_licenses')
      .select('id')
      .eq('owner_id', phone)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLicense?.id) {
      const { error: updateLicenseError } = await (supabase as any)
        .from('sentinel_licenses')
        .update({
          tier_type: planType,
          max_devices: plan.deviceLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existingLicense as { id: string }).id);
      if (updateLicenseError) {
        return NextResponse.json({ ok: false, error: updateLicenseError.message ?? 'Failed to update license' }, { status: 500 });
      }
    } else {
      const { error: insertLicenseError } = await (supabase as any)
        .from('sentinel_licenses')
        .insert({
          owner_id: phone,
          tier_type: planType,
          max_devices: plan.deviceLimit,
          expiry_date: null,
          pff_api_key: null,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        });
      if (insertLicenseError) {
        return NextResponse.json({ ok: false, error: insertLicenseError.message ?? 'Failed to create license' }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      planType,
      amountUsd: plan.priceUsd,
      deviceLimit: plan.deviceLimit,
      message: `Plan Upgraded. $${plan.priceUsd} VIDA debited from Spendable Vault. Your device limit is now ${plan.deviceLimit}.`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
