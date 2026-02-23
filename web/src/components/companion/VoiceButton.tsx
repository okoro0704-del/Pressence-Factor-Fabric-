'use client';

/** Prominent glowing microphone for voice-first. Real-Time Speech-to-Speech (Pidgin, Yoruba, Igbo, Hausa, English). */
export function VoiceButton({
  listening,
  onPress,
  disabled,
}: {
  listening?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-sovereign-gold/50 bg-sovereign-gold/20 text-sovereign-gold transition-all hover:border-sovereign-gold hover:bg-sovereign-gold/30 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50 disabled:opacity-50"
      style={{
        boxShadow: listening
          ? '0 0 24px rgba(212, 175, 55, 0.5), 0 0 48px rgba(212, 175, 55, 0.25)'
          : '0 0 16px rgba(212, 175, 55, 0.2)',
      }}
    >
      <svg
        className="h-7 w-7"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
      </svg>
    </button>
  );
}
