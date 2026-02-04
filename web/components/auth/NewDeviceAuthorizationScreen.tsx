'use client';

interface NewDeviceAuthorizationScreenProps {
  onAuthorize: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * New Device Authorization — shown when a verified user logs in on a device
 * whose fingerprint does not match stored primary_sentinel_device_id.
 * Requires a 5-second Face Pulse to confirm migration; then binding is updated and Security Alert sent.
 */
export function NewDeviceAuthorizationScreen({
  onAuthorize,
  onCancel,
  loading = false,
  error = null,
}: NewDeviceAuthorizationScreenProps) {
  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-[#16161a] p-8 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">🔐</div>
      <h2 className="text-xl font-bold text-[#e8c547] mb-2">New Device Detected</h2>
      <p className="text-sm text-[#a0a0a5] mb-6 leading-relaxed">
        This device is not your primary Sentinel device. Complete a <strong className="text-amber-400">5-second Face Pulse</strong> to
        authorize this device. Your account will be bound to this device and access from the previous device will be revoked.
      </p>
      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onAuthorize}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? '5-second Face Pulse…' : 'Authorize this device'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#2a2a2e] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-[#6b6b70] mt-6">
        A Security Alert (email/SMS) will be sent: &quot;Your Sovereign Account has been bound to a new device. Access from the previous device is now revoked.&quot;
      </p>
    </div>
  );
}
