'use client';

/** Ambient "Presence Orb" — pulses gently (heartbeat-synced placeholder). Sovereign Gold + Vitalie Blue. */
export function PresenceOrb({ calm = true }: { calm?: boolean }) {
  return (
    <div className="relative flex items-center justify-center py-6">
      <div
        className="companion-orb-pulse relative h-24 w-24 rounded-full opacity-90"
        style={{
          background: calm
            ? 'radial-gradient(circle at 30% 30%, #007FFF, #D4AF37 40%, #0d0d0f 70%)'
            : 'radial-gradient(circle at 30% 30%, #F59E0B, #D4AF37 50%, #0d0d0f 75%)',
          boxShadow: calm
            ? '0 0 40px rgba(0, 127, 255, 0.4), 0 0 80px rgba(212, 175, 55, 0.2)'
            : '0 0 50px rgba(245, 158, 11, 0.35), 0 0 60px rgba(212, 175, 55, 0.2)',
        }}
      />
    </div>
  );
}
