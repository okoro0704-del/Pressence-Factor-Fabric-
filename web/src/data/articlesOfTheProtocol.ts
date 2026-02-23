/**
 * Articles of the Protocol — Sovereign Constitution (Legal Scroll).
 * Bump constitution version in legalApprovals when changing these.
 */

export interface Article {
  number: number;
  title: string;
  body: string;
}

export const ARTICLES_OF_THE_PROTOCOL: Article[] = [
  {
    number: 1,
    title: 'Sovereignty of the Individual',
    body: 'Each citizen of the Protocol holds inalienable sovereignty over their identity, biometric data, and economic agency. No entity may subordinate this sovereignty without explicit, revocable consent attested by the citizen.',
  },
  {
    number: 2,
    title: 'The Identity Anchor',
    body: 'The Identity Anchor—the verified link between the sovereign and the Protocol—shall be the sole key to participation. It is established by multi-factor verification and maintained by the citizen. Tampering, delegation without protocol, or forgery voids standing.',
  },
  {
    number: 3,
    title: 'Biometric Quorum',
    body: 'Access to the economic and governance layers of the Protocol requires a Biometric Quorum: no fewer than three of four attested layers—Handshake, Face, Voice, Hardware—must affirm the Identity Anchor. This ensures the sovereign, and only the sovereign, may act.',
  },
  {
    number: 4,
    title: 'The Foundation Reserve',
    body: "A portion of every verified sovereign's issuance flows to the PFF Foundation Reserve, dedicated to infrastructure and the future of the Protocol. This is not taxation; it is the covenant of participation.",
  },
  {
    number: 5,
    title: 'Transparency and Audit',
    body: 'All flows that touch the Foundation, National Reserves, or Sentinel layers shall be auditable and aligned with open ledgers. Citizens may verify the integrity of the system; opacity is not permitted.',
  },
  {
    number: 6,
    title: 'Zero-Tax Ledger',
    body: 'The 50% Government Reserve accumulated from sovereign handshake issuance is the primary alternative to traditional income tax. Labor verified on the Protocol is tax-free at point of earnings; the National Reserve is funded by sovereign handshake allocation. Tax-Free Labor Compliance is attested in the Government Treasury view.',
  },
  {
    number: 7,
    title: 'Biometric Voting',
    body: 'Participation in National Referenda and PFF governance ballots requires the 3-out-of-4 Presence Gate to authorize each Vote. Once cast, the vote is hashed and stored in the national ballot box, linked to the Identity Anchor but keeping the choice anonymous. One person, one vote per election; Sentinel hardware ID and Biometric hash ensure no ghost accounts may vote.',
  },
  {
    number: 8,
    title: 'Amendment and Re-Signature',
    body: 'When the Articles of the Protocol are amended, a new constitution version shall be published. Each sovereign must re-attest by Biometric Signature to the updated Articles before continued access. Prior signatures remain on record for audit.',
  },
];

export const CONSTITUTION_PREAMBLE =
  'We, the sovereigns of the Protocol, in order to secure identity, preserve economic agency, and bind ourselves to a shared covenant, hereby adopt these Articles as the foundational law of our participation.';
