'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/biometricAuth';

interface DeviceApprovalRequest {
  id: string;
  phone_number: string;
  full_name: string;
  device_uuid: string;
  device_info: {
    userAgent: string;
    platform: string;
    timestamp: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

export function DeviceAuthorizationPanel() {
  const [approvalRequests, setApprovalRequests] = useState<DeviceApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchApprovalRequests();

    // Subscribe to real-time approval requests
    const channel = supabase
      .channel('device_approval_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'device_approval_requests'
      }, (payload: { new?: Record<string, unknown> } | undefined) => {
        if (!payload?.new || typeof payload.new !== 'object') return;
        const next = payload.new as Record<string, unknown>;
        setApprovalRequests(prev => [{ ...next } as unknown as DeviceApprovalRequest, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      const client = supabase as any;
      let query = client.from('device_approval_requests').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter === 'PENDING') query = query.eq('status', 'PENDING');
      const { data, error } = await query;

      if (error) throw error;

      setApprovalRequests(data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDevice = async (requestId: string, phoneNumber: string, deviceUUID: string) => {
    try {
      // Update approval request status
      const { error: updateError } = await (supabase as any)
        .from('device_approval_requests')
        .update({
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          approved_by: 'Architect'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add device to authorized_device_uuids in sentinel_identities
      const { data: identity, error: fetchError } = await (supabase as any)
        .from('sentinel_identities')
        .select('authorized_device_uuids')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (fetchError || !identity) throw fetchError || new Error('Identity not found');

      const updatedDevices = [...((identity as { authorized_device_uuids?: string[] }).authorized_device_uuids || []), deviceUUID];

      const { error: authError } = await (supabase as any)
        .from('sentinel_identities')
        .update({ authorized_device_uuids: updatedDevices })
        .eq('phone_number', phoneNumber);

      if (authError) throw authError;

      // Update local state
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'APPROVED' as const, approved_at: new Date().toISOString() }
            : req
        )
      );
    } catch (error) {
      console.error('Error approving device:', error);
    }
  };

  const rejectDevice = async (requestId: string, reason: string) => {
    try {
      const { error } = await (supabase as any)
        .from('device_approval_requests')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
          approved_at: new Date().toISOString(),
          approved_by: 'Architect'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'REJECTED' as const, rejection_reason: reason }
            : req
        )
      );
    } catch (error) {
      console.error('Error rejecting device:', error);
    }
  };

  useEffect(() => {
    fetchApprovalRequests();
  }, [filter]);

  return (
    <div
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">📱</div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
              Device Authorization
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6b6b70' }}>
              Approve or reject new device access requests
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'PENDING' ? 'scale-105' : 'opacity-50'
            }`}
            style={{
              background: filter === 'PENDING'
                ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
                : '#2a2a2e',
              color: filter === 'PENDING' ? '#0d0d0f' : '#6b6b70'
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'ALL' ? 'scale-105' : 'opacity-50'
            }`}
            style={{
              background: filter === 'ALL'
                ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
                : '#2a2a2e',
              color: filter === 'ALL' ? '#0d0d0f' : '#6b6b70'
            }}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-sm" style={{ color: '#6b6b70' }}>Loading approval requests...</p>
        </div>
      ) : approvalRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-bold mb-2" style={{ color: '#22c55e' }}>
            No Pending Requests
          </p>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            All device authorization requests have been processed
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {approvalRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border p-4"
              style={{
                background: request.status === 'PENDING'
                  ? 'rgba(212, 175, 55, 0.05)'
                  : 'rgba(0, 0, 0, 0.3)',
                borderColor: request.status === 'PENDING'
                  ? 'rgba(212, 175, 55, 0.3)'
                  : '#2a2a2e',
                opacity: request.status === 'PENDING' ? 1 : 0.6
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        background: request.status === 'PENDING'
                          ? '#f59e0b'
                          : request.status === 'APPROVED'
                          ? '#22c55e'
                          : '#ef4444',
                        color: '#ffffff'
                      }}
                    >
                      {request.status}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#6b6b70' }}>
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-bold mb-1" style={{ color: '#D4AF37' }}>
                    {request.full_name}
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#a0a0a5' }}>
                    {request.phone_number}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#6b6b70' }}>
                    <div>
                      <span className="font-bold">Device UUID:</span>
                      <br />
                      <span className="font-mono">{request.device_uuid.substring(0, 24)}...</span>
                    </div>
                    <div>
                      <span className="font-bold">Platform:</span>
                      <br />
                      <span>{request.device_info?.platform || 'Unknown'}</span>
                    </div>
                  </div>

                  {request.rejection_reason && (
                    <div className="mt-3 text-xs" style={{ color: '#ef4444' }}>
                      <span className="font-bold">Rejection Reason:</span> {request.rejection_reason}
                    </div>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => approveDevice(request.id, request.phone_number, request.device_uuid)}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: '#ffffff'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => rejectDevice(request.id, 'Unauthorized device')}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

