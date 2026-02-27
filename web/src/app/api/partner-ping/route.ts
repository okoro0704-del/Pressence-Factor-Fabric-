import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * Partner Ping API - Document Request Endpoint
 * 
 * Allows authorized partners (banks, government agencies) to request
 * specific documents from a user's Sovereign Vault.
 * 
 * Flow:
 * 1. Partner sends authenticated request with user phone + document type
 * 2. System checks if partner is authorized to access that document
 * 3. If authorized, retrieves encrypted document from storage
 * 4. Returns encrypted document + IV for partner to decrypt
 * 5. Logs request in audit trail
 * 
 * Security:
 * - Partner must provide valid API key
 * - User must have explicitly authorized the partner
 * - All requests are logged for compliance
 * - Documents remain encrypted (partner must have decryption key)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partner_id, phone_number, document_type, api_key } = body;

    // Validate required fields
    if (!partner_id || !phone_number || !document_type || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields: partner_id, phone_number, document_type, api_key' },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ['nin_result', 'drivers_license', 'utility_bill', 'international_passport'];
    if (!validDocTypes.includes(document_type)) {
      return NextResponse.json(
        { error: 'Invalid document_type. Must be one of: ' + validDocTypes.join(', ') },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Step 1: Verify partner API key (in production, check against partner_credentials table)
    // For now, we'll use a simple check
    const validApiKey = process.env.PARTNER_API_KEY || 'pff_partner_key_2026';
    if (api_key !== validApiKey) {
      await logPartnerPing(supabase, phone_number, partner_id, document_type, false, false, request);
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Step 2: Check if partner is authorized to access this document
    const { data: authorization, error: authError } = await (supabase as any)
      .from('partner_document_authorizations')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('partner_id', partner_id)
      .eq('document_type', document_type)
      .is('revoked_at', null)
      .single();

    if (authError || !authorization) {
      await logPartnerPing(supabase, phone_number, partner_id, document_type, false, false, request);
      return NextResponse.json(
        { error: 'Partner not authorized to access this document' },
        { status: 403 }
      );
    }

    // Step 3: Check if authorization has expired
    if (authorization.expires_at && new Date(authorization.expires_at) < new Date()) {
      await logPartnerPing(supabase, phone_number, partner_id, document_type, true, false, request);
      return NextResponse.json(
        { error: 'Authorization has expired' },
        { status: 403 }
      );
    }

    // Step 4: Retrieve document metadata
    const { data: document, error: docError } = await (supabase as any)
      .from('sovereign_vault_documents')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('document_type', document_type)
      .single();

    if (docError || !document) {
      await logPartnerPing(supabase, phone_number, partner_id, document_type, true, false, request);
      return NextResponse.json(
        { error: 'Document not found in vault' },
        { status: 404 }
      );
    }

    // Step 5: Retrieve encrypted document from storage
    const { data: fileData, error: storageError } = await (supabase as any)
      .storage
      .from('sovereign-vault')
      .download(document.encrypted_url);

    if (storageError || !fileData) {
      await logPartnerPing(supabase, phone_number, partner_id, document_type, true, false, request);
      return NextResponse.json(
        { error: 'Failed to retrieve document from storage' },
        { status: 500 }
      );
    }

    // Step 6: Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Step 7: Log successful request
    await logPartnerPing(supabase, phone_number, partner_id, document_type, true, true, request);

    // Step 8: Return encrypted document + metadata
    return NextResponse.json({
      success: true,
      document: {
        type: document_type,
        file_name: document.file_name,
        file_size: document.file_size,
        uploaded_at: document.uploaded_at,
        encrypted_data: base64,
        iv: document.iv,
      },
      message: 'Document retrieved successfully. Use the IV to decrypt with your shared key.',
    });

  } catch (error) {
    console.error('[Partner Ping] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function logPartnerPing(
  supabase: any,
  phone_number: string,
  partner_id: string,
  document_type: string,
  authorized: boolean,
  document_provided: boolean,
  request: NextRequest
) {
  try {
    await supabase
      .from('partner_ping_audit_log')
      .insert({
        phone_number,
        partner_id,
        document_type,
        authorized,
        document_provided,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        request_metadata: {
          timestamp: new Date().toISOString(),
          method: request.method,
        },
      });
  } catch (error) {
    console.error('[Partner Ping] Failed to log audit:', error);
  }
}

