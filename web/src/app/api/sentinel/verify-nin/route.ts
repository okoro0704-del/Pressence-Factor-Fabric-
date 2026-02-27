import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * NIN Verification API Endpoint
 * 
 * DOORKEEPER PROTOCOL: Stateless Frontend
 * This endpoint forwards NIN verification requests to Sentinel Backend
 * Sentinel performs the actual verification against NIMC/FIRS 2026 database
 * and triggers the Sovereign Strike (11 VIDA mint: 5-5-1 split)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nin, phone } = body;

    // Validate inputs
    if (!nin || typeof nin !== 'string' || nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return NextResponse.json(
        { verified: false, error: 'Invalid NIN format. Must be exactly 11 digits.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { verified: false, error: 'Phone number required.' },
        { status: 400 }
      );
    }

    // Check if user already vitalized
    const supabase = getSupabase();
    if (supabase) {
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('vitalization_status, nin')
        .eq('phone_number', phone)
        .maybeSingle();

      if (profile?.vitalization_status === 'VITALIZED') {
        return NextResponse.json(
          { verified: false, error: 'Identity already vitalized. One face = one mint.' },
          { status: 400 }
        );
      }

      // Check if NIN already used
      if (profile?.nin && profile.nin !== nin) {
        return NextResponse.json(
          { verified: false, error: 'Different NIN already registered for this account.' },
          { status: 400 }
        );
      }

      // Check if this NIN is already used by another account
      const { data: existingNIN } = await (supabase as any)
        .from('user_profiles')
        .select('phone_number')
        .eq('nin', nin)
        .neq('phone_number', phone)
        .maybeSingle();

      if (existingNIN) {
        return NextResponse.json(
          { verified: false, error: 'This NIN is already registered to another account.' },
          { status: 400 }
        );
      }
    }

    // Forward to Sentinel Backend for verification
    const sentinelUrl = process.env.SENTINEL_API_URL || process.env.NEXT_PUBLIC_SENTINEL_API_URL;
    if (!sentinelUrl) {
      console.error('[NIN Verification] Sentinel API URL not configured');
      return NextResponse.json(
        { verified: false, error: 'Verification service unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    const sentinelResponse = await fetch(`${sentinelUrl}/api/verify-nin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SENTINEL_API_KEY || ''}`,
      },
      body: JSON.stringify({ nin, phone }),
    });

    const sentinelData = await sentinelResponse.json();

    if (!sentinelResponse.ok || !sentinelData.verified) {
      return NextResponse.json(
        { verified: false, error: sentinelData.error || 'NIN verification failed.' },
        { status: sentinelResponse.status }
      );
    }

    // Sentinel verified successfully and triggered Sovereign Strike
    // Update local database with NIN and vitalization status
    if (supabase) {
      await (supabase as any)
        .from('user_profiles')
        .update({
          nin,
          vitalization_status: 'VITALIZED',
          vitalized_at: new Date().toISOString(),
        })
        .eq('phone_number', phone);
    }

    return NextResponse.json({
      verified: true,
      message: 'Identity verified successfully. Sovereign Strike triggered.',
      data: sentinelData.data,
    });
  } catch (error) {
    console.error('[NIN Verification] Error:', error);
    return NextResponse.json(
      { verified: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

