'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { LoginRequestRow } from '@/lib/loginRequest';
import { LoginRequestNotification } from '@/components/auth/LoginRequestNotification';
import { isCurrentDevicePrimary } from '@/lib/phoneIdBridge';

interface LoginRequestListenerProps {
  phoneNumber: string;
}

/**
 * Listens for new login_requests for this user (phone). When a PENDING request appears,
 * shows notification only on the MAIN device (primary) so the user can approve from the device they first used.
 * Sub devices do not see the approval prompt — only the main device can approve.
 */
export function LoginRequestListener({ phoneNumber }: LoginRequestListenerProps) {
  const [pendingRequest, setPendingRequest] = useState<LoginRequestRow | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isPrimary, setIsPrimary] = useState<boolean | null>(null);

  useEffect(() => {
    if (!phoneNumber?.trim()) return;

    let cancelled = false;
    isCurrentDevicePrimary(phoneNumber.trim()).then((primary) => {
      if (!cancelled) setIsPrimary(primary);
    });
    return () => { cancelled = true; };
  }, [phoneNumber]);

  useEffect(() => {
    if (!phoneNumber?.trim() || isPrimary !== true) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = (supabase as any)
      .channel('login_requests_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_requests',
          filter: `phone_number=eq.${phoneNumber.trim()}`,
        },
        (payload: { new: LoginRequestRow }) => {
          const row = payload?.new;
          if (row && row.status === 'PENDING') {
            setPendingRequest(row);
            setShowNotification(true);
          }
        }
      )
      .subscribe();

    // Check for existing PENDING request on mount (only when this device is primary)
    (async () => {
      const { data } = await (supabase as any)
        .from('login_requests')
        .select('*')
        .eq('phone_number', phoneNumber.trim())
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setPendingRequest(data as LoginRequestRow);
        setShowNotification(true);
      }
    })();

    return () => {
      channel.unsubscribe();
    };
  }, [phoneNumber, isPrimary]);

  const handleClose = () => {
    setShowNotification(false);
    setPendingRequest(null);
  };

  if (!showNotification || !pendingRequest) return null;

  return (
    <LoginRequestNotification
      request={pendingRequest}
      onApprove={() => {}}
      onDeny={() => {}}
      onClose={handleClose}
    />
  );
}
