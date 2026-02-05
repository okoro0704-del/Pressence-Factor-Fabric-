'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { LoginRequestRow } from '@/lib/loginRequest';
import { LoginRequestNotification } from '@/components/auth/LoginRequestNotification';

interface LoginRequestListenerProps {
  phoneNumber: string;
}

/**
 * Listens for new login_requests for this user (phone). When a PENDING request appears,
 * shows notification: "Isreal, are you trying to log in on a new Computer?" with Approve/Deny.
 */
export function LoginRequestListener({ phoneNumber }: LoginRequestListenerProps) {
  const [pendingRequest, setPendingRequest] = useState<LoginRequestRow | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!phoneNumber?.trim()) return;

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

    // Check for existing PENDING request on mount
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
  }, [phoneNumber]);

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
