'use client';

/** Glowing globe in the dashboard body — subtle gold/amber glow. */
export function GlowingGlobe({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <div
        className="w-48 h-48 md:w-64 md:h-64 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.12) 40%, transparent 70%)',
          boxShadow: '0 0 80px 40px rgba(212, 175, 55, 0.15), 0 0 120px 60px rgba(212, 175, 55, 0.08), inset 0 0 60px 20px rgba(212, 175, 55, 0.06)',
        }}
      />
      <div
        className="absolute w-40 h-40 md:w-56 md:h-56 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(232, 197, 71, 0.25) 0%, transparent 65%)',
          boxShadow: 'inset 0 0 50px 15px rgba(212, 175, 55, 0.1)',
        }}
      />
    </div>
  );
}
