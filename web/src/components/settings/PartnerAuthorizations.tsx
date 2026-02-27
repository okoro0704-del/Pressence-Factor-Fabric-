'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getSupabase } from '@/lib/supabase';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

interface Authorization {
  id: string;
  partner_id: string;
  document_type: string;
  authorized_at: string;
  expires_at?: string;
  revoked_at?: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
  nin_result: 'NIN Verification Result',
  drivers_license: "Driver's License",
  utility_bill: 'Utility Bill',
  international_passport: 'International Passport',
};

const PARTNER_NAMES: Record<string, string> = {
  UBA: 'United Bank for Africa',
  ACCESS_BANK: 'Access Bank',
  GTB: 'Guaranty Trust Bank',
  ZENITH: 'Zenith Bank',
  FIRST_BANK: 'First Bank of Nigeria',
  FIRS: 'Federal Inland Revenue Service',
  NIMC: 'National Identity Management Commission',
};

/**
 * Partner Authorizations - Manage Document Access
 * 
 * Allows users to:
 * - View which partners have access to their documents
 * - Revoke partner access
 * - See audit log of partner requests
 */
export function PartnerAuthorizations() {
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const identityPhone = getIdentityAnchorPhone();
    setPhone(identityPhone);
    
    if (identityPhone) {
      loadAuthorizations(identityPhone);
    }
  }, []);

  const loadAuthorizations = async (phoneNumber: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await (supabase as any)
        .from('partner_document_authorizations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('authorized_at', { ascending: false });

      if (error) throw error;

      setAuthorizations(data || []);
    } catch (err) {
      console.error('[Partner Authorizations] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeAuthorization = async (authId: string) => {
    if (!phone) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await (supabase as any)
        .from('partner_document_authorizations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', authId);

      if (error) throw error;

      // Reload authorizations
      await loadAuthorizations(phone);
    } catch (err) {
      console.error('[Partner Authorizations] Error revoking:', err);
    }
  };

  const getAuthStatus = (auth: Authorization) => {
    if (auth.revoked_at) return 'revoked';
    if (auth.expires_at && new Date(auth.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212, 175, 55, 0.2)' }}
        >
          <Shield className="w-6 h-6" style={{ color: GOLD }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: GOLD }}>
            Partner Authorizations
          </h2>
          <p className="text-sm" style={{ color: GRAY }}>
            Manage which partners can access your documents
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: GOLD }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && authorizations.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: GRAY }} />
          <p className="text-sm" style={{ color: GRAY }}>
            No partner authorizations yet
          </p>
        </div>
      )}

      {/* Authorizations List */}
      {!loading && authorizations.length > 0 && (
        <div className="space-y-3">
          {authorizations.map((auth) => {
            const status = getAuthStatus(auth);
            return (
              <AuthorizationCard
                key={auth.id}
                authorization={auth}
                status={status}
                onRevoke={() => revokeAuthorization(auth.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AUTHORIZATION CARD COMPONENT
// ============================================================================

interface AuthorizationCardProps {
  authorization: Authorization;
  status: 'active' | 'expired' | 'revoked';
  onRevoke: () => void;
}

function AuthorizationCard({ authorization, status, onRevoke }: AuthorizationCardProps) {
  const statusConfig = {
    active: { icon: CheckCircle2, color: '#22c55e', label: 'Active' },
    expired: { icon: Clock, color: '#f59e0b', label: 'Expired' },
    revoked: { icon: XCircle, color: '#ef4444', label: 'Revoked' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        borderColor: status === 'active' ? 'rgba(34, 197, 94, 0.4)' : '#2a2a2e',
        background: status === 'active' ? 'rgba(34, 197, 94, 0.05)' : '#16161a',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${config.color}20` }}
          >
            <StatusIcon className="w-5 h-5" style={{ color: config.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1" style={{ color: GOLD }}>
              {PARTNER_NAMES[authorization.partner_id] || authorization.partner_id}
            </h3>
            <p className="text-xs mb-2" style={{ color: GRAY }}>
              Document: {DOCUMENT_LABELS[authorization.document_type] || authorization.document_type}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: GRAY }}>
              <span>Authorized: {new Date(authorization.authorized_at).toLocaleDateString()}</span>
              {authorization.expires_at && (
                <span>Expires: {new Date(authorization.expires_at).toLocaleDateString()}</span>
              )}
              <span className="flex items-center gap-1" style={{ color: config.color }}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {status === 'active' && (
          <button
            onClick={onRevoke}
            className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}

