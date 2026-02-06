'use client';

interface NewDeviceAuthorizationScreenProps {
  onAuthorize: () => void;
  onAddFromPhone?: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * New Device Authorization — shown when a verified user logs in on a device
 * whose device ID does not match stored primary_sentinel_device_id.
 * Options: (1) Add this device by approving from phone — keeps both devices. (2) Authorize this device only — 5s Face Pulse, replaces primary.
 */
export function NewDeviceAuthorizationScreen({
  onAuthorize,
  onAddFromPhone,
  onCancel,
  loading = false,
  error = null,
}: NewDeviceAuthorizationScreenProps) {
  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-[#16161a] p-8 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">🔐</div>
      <h2 className="text-xl font-bold text-[#e8c547] mb-2">New Device Detected</h2>
      <p className="text-sm text-[#a0a0a5] mb-6 leading-relaxed">
        This device is not your primary Sentinel device. You can <strong className="text-[#D4AF37]">add it</strong> by approving from your phone (keeps both devices), or <strong className="text-amber-400">authorize only this device</strong> with a 5-second Face Pulse (your phone will lose access).
      </p>
      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}
      <div className="flex flex-col gap-3">
        {onAddFromPhone && (
          <button
            type="button"
            onClick={onAddFromPhone}
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#c9a227] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add this device — approve from my phone
          </button>
        )}
        <button
          type="button"
          onClick={onAuthorize}
          disabled={loading}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? '5-second Face Pulse…' : 'Authorize only this device (replace phone)'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full px-6 py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#2a2a2e] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      {onAddFromPhone && (
        <p className="text-xs text-[#6b6b70] mt-6">
          Open PFF on your phone; you&apos;ll see a prompt to approve this device. After approval, you can use both devices.
        </p>
      )}
      {!onAddFromPhone && (
        <p className="text-xs text-[#6b6b70] mt-6">
          A Security Alert will be sent if you authorize only this device: your account will be bound here and access from the previous device revoked.
        </p>
      )}
    </div>
  );
}
