/**
 * Sovereign Voice Confirmation — synthetic voice feedback for Face Pulse.
 * Triggers at the exact moment Face Hash is confirmed (success) or scan fails (error).
 * Voice profile: calm, authoritative, Tech-Elite (rate 0.9, pitch 1.0).
 */

const SOVEREIGN_RATE = 0.9;
const SOVEREIGN_PITCH = 1.0;

const SUCCESS_SCRIPT =
  'Sovereign Identity Confirmed. One VIDA anchored. Welcome to the Protocol, Architect.';

const VITALIZATION_SCRIPT =
  'Vitalization complete. Face and palm confirmed. I see you. Your hand is true.';

const ALIGNMENT_FAILED_SCRIPT =
  'Position face clearly in frame. Scan can proceed.';

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Prefer a high-quality, calm, authoritative voice (e.g. Google UK Male, Microsoft David, or first available). */
function getSovereignVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  let voices = window.speechSynthesis.getVoices();
  if (!voices.length && typeof window !== 'undefined') {
    window.speechSynthesis.getVoices();
    voices = window.speechSynthesis.getVoices();
  }
  if (!voices.length) return null;
  const preferred = [
    'Google UK English Male',
    'Microsoft David - English (United States)',
    'Samantha',
    'Daniel',
    'Google US English',
    'Microsoft Zira',
  ];
  for (const name of preferred) {
    const v = voices.find(
      (x) => x.name.includes(name) || name.includes(x.name)
    );
    if (v) return v;
  }
  const en = voices.find((v) => v.lang.startsWith('en'));
  return en ?? voices[0];
}

function speak(text: string): void {
  if (!isSpeechSupported()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = SOVEREIGN_RATE;
  u.pitch = SOVEREIGN_PITCH;
  u.volume = 1;
  const voice = getSovereignVoice();
  if (voice) u.voice = voice;
  u.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/**
 * Call at the exact moment the Face Hash is successfully saved and the Face Mesh turns Gold.
 * Speaks: "Sovereign Identity Confirmed. One VIDA anchored. Welcome to the Protocol, Architect."
 */
export function speakSovereignSuccess(): void {
  speak(SUCCESS_SCRIPT);
}

/**
 * Call when both Face and Palm are verified (Vitalization: Face first, then Palm).
 */
export function speakVitalizationSuccess(): void {
  speak(VITALIZATION_SCRIPT);
}

/**
 * Call when the scan needs repositioning (alignment). Scan is allowed to proceed even if lighting isn’t studio-perfect.
 * Speaks: "Position face clearly in frame. Scan can proceed."
 */
export function speakSovereignAlignmentFailed(): void {
  speak(ALIGNMENT_FAILED_SCRIPT);
}
