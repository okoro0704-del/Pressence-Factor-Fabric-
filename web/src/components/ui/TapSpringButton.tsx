'use client';

import { motion } from 'framer-motion';

/**
 * Mobile-first touch target (min 48px) with spring tap feedback.
 * Use for primary actions: Mint, Transfer, Vote, Activate Sentinel.
 */

export interface TapSpringButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Show loading spinner inside button (disables and shows spinner). */
  loading?: boolean;
  variant?: 'gold' | 'outline' | 'ghost';
  className?: string;
}

const variants = {
  gold: 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]/50 hover:opacity-90 active:opacity-95',
  outline: 'bg-transparent text-[#D4AF37] border-2 border-[#D4AF37]/50 hover:bg-[#D4AF37]/10',
  ghost: 'bg-transparent text-[#a0a0a5] border border-[#2a2a2e] hover:bg-[#16161a]',
};

export function TapSpringButton({
  children,
  loading = false,
  variant = 'gold',
  className = '',
  disabled,
  ...rest
}: TapSpringButtonProps) {
  return (
    <motion.button
      type="button"
      className={`
        min-h-[48px] min-w-[48px] inline-flex items-center justify-center gap-2 px-4 py-3
        rounded-lg font-medium text-sm uppercase tracking-wider
        transition-colors disabled:opacity-50 disabled:pointer-events-none
        touch-manipulation
        ${variants[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="w-5 h-5 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
