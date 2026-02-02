/**
 * PFF Frontend — Lexicon Page
 * Definitions for PFF, SOVRYN, VIDA CAP, ATE, and VLT
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import CountdownClock from '../components/CountdownClock';

interface LexiconEntry {
  term: string;
  acronym?: string;
  definition: string;
  details: string[];
  icon: string;
}

const lexiconEntries: LexiconEntry[] = [
  {
    term: 'Presence Factor Fabric',
    acronym: 'PFF',
    icon: '🔐',
    definition: 'Triple-lock biometric authentication system that proves human presence through Phone + Face + Fingerprint verification.',
    details: [
      'Sequential 4-phase handshake with 1.5-second cohesion rule',
      'Phases: Face Recognition → Fingerprint Scan → Heart Rate → Voice Biometric',
      'All phases must complete within 1,500ms or buffer is flushed',
      'Zero-knowledge principle: No raw biometric data transmitted',
      'Generates cryptographic Presence Proof for authentication',
      'Foundation of the entire Sovereign Identity system',
    ],
  },
  {
    term: 'SOVRYN',
    acronym: 'SOVRYN',
    icon: '⚡',
    definition: 'DeFi protocol on Rootstock (RSK) blockchain that powers the economic layer of the Sovereign system.',
    details: [
      'Built on Rootstock (RSK) - Bitcoin sidechain (Chain ID 30)',
      'Provides decentralized exchange and liquidity pools',
      'SOVRYN Oracle delivers real-time VIDA/USD price feeds',
      'Enables trustless swaps and revenue distribution',
      'Powers the 1% Sovereign Movement protocol pull',
      'Integrates with Sentinel Business Block for revenue oversight',
    ],
  },
  {
    term: 'VIDA Cap',
    acronym: 'VIDA CAP',
    icon: '💎',
    definition: 'Base economic unit minted upon citizen vitalization. Represents the foundational wealth of a sovereign citizen.',
    details: [
      '1 VIDA Cap minted per citizen upon successful PFF vitalization',
      '50/50 Doctrine: Split equally between Citizen Vault and National Reserve',
      'Citizen receives 0.5 VIDA Cap in personal vault',
      'Nation receives 0.5 VIDA Cap in National Reserve for liquidity backing',
      'Immutable and non-transferable base unit',
      'Backs the spendable $VIDA currency at 1:1 ratio',
    ],
  },
  {
    term: 'Architect Tribute Engine',
    acronym: 'ATE',
    icon: '🏛️',
    definition: 'Revenue distribution mechanism that ensures sustainable development while empowering citizens.',
    details: [
      'Sentinel 1% Sovereign Split: 99% Architect retention, 1% Sovereign Movement',
      '1% split breakdown: 0.5% → National Escrow, 0.5% → Global Citizen Block',
      'Monthly Truth Dividend: Equal distribution to verified truth-tellers',
      'Truth-Teller Filter: Only citizens with successful 4-layer PFF handshake qualify',
      'Architect\'s Shield: 99% moved to architect_vault before monthly flush',
      'Transparent VLT logging of all revenue flows',
    ],
  },
  {
    term: 'Vitalie Truth Ledger',
    acronym: 'VLT',
    icon: '📜',
    definition: 'Blockchain-based immutable ledger that records all transactions, handshakes, and system events for complete transparency.',
    details: [
      'Public verification of all VIDA Cap minting events',
      'Transparent logging of Sentinel activations and revenue splits',
      'Immutable record of monthly dividend distributions',
      'Root Node operations and Emergency Stasis events logged',
      'Zero-knowledge proofs for biometric verification (no raw data exposed)',
      'Enables citizen verification of National Reserve and Global Citizen Block balances',
    ],
  },
];

export const Lexicon: React.FC = () => {
  return (
    <div className="sovereign-portal">
      <div className="page-container">
        <CountdownClock variant="compact" showTitle={false} />
        
        <div className="page-header">
          <h1 className="page-title">📖 Sovereign Lexicon</h1>
          <p className="page-subtitle">
            The foundational terminology of the Presence Factor Fabric and Sovereign Economic System
          </p>
        </div>

        <div className="lexicon-grid">
          {lexiconEntries.map((entry, index) => (
            <div key={index} className="lexicon-card">
              <div className="lexicon-card-header">
                <span className="lexicon-icon">{entry.icon}</span>
                <div className="lexicon-title-group">
                  <h2 className="lexicon-term">{entry.term}</h2>
                  {entry.acronym && (
                    <span className="lexicon-acronym">{entry.acronym}</span>
                  )}
                </div>
              </div>

              <p className="lexicon-definition">{entry.definition}</p>

              <div className="lexicon-details">
                <h3 className="lexicon-details-title">Key Features:</h3>
                <ul className="lexicon-details-list">
                  {entry.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="lexicon-footer">
          <p className="lexicon-footer-text">
            🏛️ <strong>The Sovereign Lexicon</strong> — Understanding the language of digital sovereignty
          </p>
        </div>
      </div>
    </div>
  );
};

export default Lexicon;

