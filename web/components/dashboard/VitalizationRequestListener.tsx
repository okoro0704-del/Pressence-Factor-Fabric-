'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/biometricAuth';
import { SovereignPushNotification } from '@/components/auth/SovereignPushNotification';
import { VitalizationRequest, getCurrentDeviceInfo } from '@/lib/multiDeviceVitalization';

interface VitalizationRequestListenerProps {
  phoneNumber: string;
}

/**
 * VITALIZATION REQUEST LISTENER
 * Listens for new vitalization requests on PRIMARY_SENTINEL device
 * Shows Sovereign Push notification when secondary device requests access
 */
export function VitalizationRequestListener({ phoneNumber }: VitalizationRequestListenerProps) {
  const [pendingRequest, setPendingRequest] = useState<VitalizationRequest | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Subscribe to new vitalization requests for this user
    const channel = (supabase as any)
      .channel('vitalization_requests_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vitalization_requests',
          filter: `phone_number=eq.${phoneNumber}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          const newRequest = payload?.new as unknown as VitalizationRequest | undefined;
          if (!newRequest) return;
          console.log('🔔 New vitalization request received:', newRequest);

          // Only show notification if this is the primary device
          const currentDevice = getCurrentDeviceInfo();
          if (newRequest.device_id !== currentDevice.deviceId) {
            setPendingRequest(newRequest);
            setShowNotification(true);
          }
        }
      );
    channel.subscribe();

    // Check for existing pending requests on mount
    const checkPendingRequests = async () => {
      const { data: rows, error } = await supabase
        .from('vitalization_requests')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('status', 'PENDING')
        .order('requested_at', { ascending: false })
        .limit(1);

      const data = Array.isArray(rows) ? rows[0] : rows;
      if (!error && data) {
        const currentDevice = getCurrentDeviceInfo();
        if (data.device_id !== currentDevice.deviceId) {
          setPendingRequest(data as VitalizationRequest);
          setShowNotification(true);
        }
      }
    };

    checkPendingRequests();

    return () => {
      try {
        (channel as { unsubscribe?: () => void }).unsubscribe?.();
      } catch {
        (supabase as any).removeChannel?.(channel);
      }
    };
  }, [phoneNumber]);

  const handleApprove = () => {
    console.log('✅ Vitalization request approved');
    setShowNotification(false);
    setPendingRequest(null);
  };

  const handleDeny = () => {
    console.log('❌ Vitalization request denied');
    setShowNotification(false);
    setPendingRequest(null);
  };

  const handleClose = () => {
    setShowNotification(false);
    setPendingRequest(null);
  };

  if (!showNotification || !pendingRequest) {
    return null;
  }

  const currentDevice = getCurrentDeviceInfo();

  return (
    <SovereignPushNotification
      vitalizationRequest={pendingRequest}
      primaryDeviceId={currentDevice.deviceId}
      onApprove={handleApprove}
      onDeny={handleDeny}
      onClose={handleClose}
    />
  );
}

