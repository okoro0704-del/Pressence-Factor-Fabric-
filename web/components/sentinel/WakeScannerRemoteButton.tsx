'use client';

import { useState } from 'react';
import { sendSentinelRemoteCommand } from '@/lib/sentinelRemoteCommands';

interface WakeScannerRemoteButtonProps {
  /** User's phone (Identity Anchor) — the phone that will receive the wake command. */
  phoneNumber: string;
  className?: string;
}

/**
 * Sentinel (laptop): click to send 'wake_scanner' to the user's phone via Supabase Realtime.
 * The phone's BiometricPillar listens and calls triggerExternalCapture() to put the scanner in Auto-On mode.
 */
export function WakeScannerRemoteButton({ phoneNumber, className }: WakeScannerRemoteButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleWake = async () => {
    const trimmed = phoneNumber?.trim();
    if (!trimmed) {
      setMessage('Enter phone number first');
      return;
    }
    setSending(true);
    setMessage(null);
    const result = await sendSentinelRemoteCommand(trimmed, 'wake_scanner');
    setSending(false);
    if (result.ok) {
      setMessage('Command sent. Scanner should wake on phone.');
    } else {
      setMessage(result.error ?? 'Failed to send');
    }
    if (result.ok) setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleWake}
        disabled={sending || !phoneNumber?.trim()}
        className="px-4 py-2 rounded-lg font-semibold text-sm bg-[#D4AF37] text-[#0d0d0f] hover:opacity-90 disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Wake scanner on phone'}
      </button>
      {message && (
        <p className={`mt-2 text-xs ${message.startsWith('Command sent') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
