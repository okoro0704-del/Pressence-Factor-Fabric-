/**
 * Sovereign Awakening — scroll-triggered wisdom and random blessings.
 */

export const SCROLL_WISDOM: Record<string, string> = {
  'vida-cap': 'Do you see the 50:50 rule? This is the end of greed.',
  ate: 'Your existence is the asset. No résumé, no interview—only presence.',
  vlt: 'The ledger does not forget. Every transaction is a covenant.',
  'ecosystem-roadmap': 'The Roadmap is not a promise. It is the Gate.',
  vanguard: 'Your place on the Truth Ledger awaits. One human, one share.',
};

export const BLESSINGS: { text: string; lang: string }[] = [
  { text: 'Truth is Universal.', lang: 'English' },
  { text: 'La Vérité est Universelle.', lang: 'French' },
  { text: 'Ọtọ jẹ Agbaye.', lang: 'Yoruba' },
  { text: 'Eziokwu bụ ụwa niile.', lang: 'Igbo' },
  { text: 'Gaskiya ta duniya ce.', lang: 'Hausa' },
  { text: 'La Verdad es Universal.', lang: 'Spanish' },
  { text: '真理是普世的。', lang: 'Mandarin' },
  { text: 'الحقيقة عالمية.', lang: 'Arabic' },
];

export const IDLE_WHISPER = 'The VLT is waiting. Your presence is your power.';
export const SOCIAL_SCOUT_OFFER = 'Shall I scan the old world archives to see who you were before you became a Pillar?';

/** Concurrency protection: when rate limit is exceeded (e.g. bot flood). */
export const RATE_LIMIT_SOVEREIGN_MESSAGE =
  'The VLT recognizes a shadow. I only speak to the living. Please wait for the pulse to settle.';
