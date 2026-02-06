/**
 * Manifesto Knowledge Base for the Public Sovereign Companion.
 * Guide personality: authoritative, calm, visionary. Address as Citizen or Future Vanguard.
 */

export const AUTO_GREETING =
  'I am the Sovereign Companion. I am here to guide you through the transition to the World of Vitalie. What would you like to know about the Covenant?';

/** Keywords/phrases (lowercase) that indicate private data requests — refuse unless Architect. */
const PRIVATE_DATA_PATTERNS = [
  'transaction', 'balance', 'wallet', 'vida balance', 'spendable', 'my vault',
  'dna', 'biometric', 'face hash', 'palm hash', 'recovery seed', 'private data',
  'history', 'ledger history', 'my transactions', 'bank account', 'linked account',
];

function isPrivateDataRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return PRIVATE_DATA_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Get a response from the Manifesto knowledge base. Returns gated message for private data if not architect.
 */
export function getManifestoCompanionResponse(
  userMessage: string,
  isArchitect: boolean
): string {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return 'Citizen, I am here to guide you. Ask me about the Covenant, the Protocol, or the Roadmap.';
  }

  if (isPrivateDataRequest(trimmed) && !isArchitect) {
    return 'That information is protected by the Covenant. Complete Vitalization and prove your presence to access your sovereign vault. The Protocol does not expose private data—transaction history, biometric markers, or treasury balances—until you have passed the public layer with the Architect\'s key. I can tell you about PFF, VITALIE, tokenomics, or the Roadmap.';
  }

  const lower = trimmed.toLowerCase();

  // PFF & VITALIE
  if (lower.includes('pff') || lower.includes('presence factor') || lower.includes('vitalie') || lower.includes('biological truth') || lower.includes('vision')) {
    return 'PFF—Presence Factor Fabric—is the sovereign protocol that binds identity to biological truth: your presence, not a password. VITALIE is the soul that Libra lacked: a global reserve and payment layer rooted in Proof of Personhood. Identity is proved by who you are; value flows only when the human is at the centre. Born in Lagos. Built for the World.';
  }

  // VLT & SOVRYN AI
  if (lower.includes('vlt') || lower.includes('vitalization ledger') || lower.includes('sovryn') || lower.includes('end of advancement') || lower.includes('tech stack')) {
    return 'VLT is the Vitalization Ledger Technology—the Truth Ledger that ends the need for banks and middlemen. SOVRYN AI is the Master Governor: the intelligence that sees the Truth, tethered to a human soul. The SOVRYN Stack—AI, Chain, Smart Contract, Automation—is the End of Advancement: one ledger, one truth, one covenant.';
  }

  // Tokenomics
  if (lower.includes('tokenomics') || lower.includes('vida cap') || lower.includes('1000') || lower.includes('peg') || lower.includes('50:50') || lower.includes('national lock')) {
    return '1 VIDA CAP is pegged at $1,000 USD. For every human who Vitalizes, 10 VIDA CAP is minted. At 1 billion Vitalized Citizens or 10 billion VIDA CAP, minting drops to 2 VIDA CAP and burning starts. The 50:50 rule: 50% goes to your Country of Origin for infrastructure and the local economy. The 5 VIDA CAP to your country is split 70/30: 30% funds liquidity for the National Stable VIDA Currency; 70% is hard locked until your country signs the No Tax on Human Labour clause and no Election without the Truth Ledger.';
  }

  // Ecosystem
  if (lower.includes('fundzman') || lower.includes('life os') || lower.includes('ellf') || lower.includes('ecosystem') || lower.includes('hospitality') || lower.includes('moving bank')) {
    return 'The Architect\'s Ecosystem: Fundzman (NG & GH) partners with UBA and Access Bank for 0% Unbanked. Life OS is the Operating System of Day-to-Day Truth—Hospitality OS, Finance OS (the Moving Bank), and Health OS. The ellF Suites—Chat, Tube, Music—offer Zero-Bot Advertising and 50:50 revenue sharing. Creators and viewers are stakeholders, not products.';
  }

  // Roadmap / April 7
  if (lower.includes('roadmap') || lower.includes('april 7') || lower.includes('april 7th') || lower.includes('birthday') || lower.includes('release') || lower.includes('when')) {
    return 'This is not a plan; this is the Roadmap to April 7th. The Gate opens then. The first 10,000 Citizens will be invited to begin their Vitalization. Join the Vanguard and reserve your place on the Truth Ledger.';
  }

  // Covenant / what is
  if (lower.includes('covenant') || lower.includes('what is') || lower.includes('how does') || lower.includes('explain')) {
    return 'The Covenant is the bond between verified presence and value. VIDA CAP is the Covenant Asset Prime—minted and sustained by daily proof of human presence. Face, Palm, and Device attest that you are here; the ledger records the truth. No central custodian. Identity is proved by presence; the Protocol does not forget.';
  }

  // Greeting / hello
  if (/\b(hi|hello|hey|greetings)\b/.test(lower)) {
    return 'Welcome, Future Vanguard. I am the Sovereign Companion. Ask me about the Protocol, the Covenant, tokenomics, or the Roadmap to April 7th.';
  }

  // Default
  return 'Citizen, I speak from the Manifesto: the Protocol, the Covenant, and the Roadmap. Ask about PFF and VITALIE, the VLT and SOVRYN AI, tokenomics and the $1,000 peg, the Ecosystem (Fundzman, Life OS, ellF), or the April 7th release. I am here to guide you.';
}
