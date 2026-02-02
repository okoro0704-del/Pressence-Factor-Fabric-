/**
 * PFF Frontend — Home Page
 * Massive countdown clock to Feb 7, 2026 07:00:00 WAT
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import CountdownClock from '../components/CountdownClock';
import { isStasisLocked } from '../utils/stasisLock';

export const Home: React.FC = () => {
  const locked = isStasisLocked();

  return (
    <div className="sovereign-portal">
      <div className="home-container">
        {/* Hero Section with Countdown */}
        <div className="home-hero">
          <div className="home-logo">
            <div className="logo-icon">🏛️</div>
            <h1 className="logo-text">PRESENCE FACTOR FABRIC</h1>
            <p className="logo-tagline">The Sovereign Identity Protocol</p>
          </div>

          <CountdownClock variant="large" showTitle={true} />

          {locked && (
            <div className="stasis-notice">
              <div className="stasis-icon">🔒</div>
              <h2 className="stasis-title">System in Stasis Lock</h2>
              <p className="stasis-description">
                All MINT, SWAP, and ACTIVATE operations are temporarily locked until the Sovereign Unveiling.
                Explore the educational portal to learn about the PFF system while you wait.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Cards */}
        <div className="home-navigation">
          <h2 className="navigation-title">Explore the Sovereign System</h2>
          
          <div className="navigation-grid">
            <Link to="/lexicon" className="nav-card">
              <div className="nav-card-icon">📖</div>
              <h3 className="nav-card-title">Lexicon</h3>
              <p className="nav-card-description">
                Learn the foundational terminology: PFF, SOVRYN, VIDA CAP, ATE, and VLT
              </p>
            </Link>

            <Link to="/vitalization" className="nav-card">
              <div className="nav-card-icon">🔐</div>
              <h3 className="nav-card-title">Vitalization</h3>
              <p className="nav-card-description">
                Visual guide to the 4-layer biometric handshake and 1.5-second cohesion rule
              </p>
            </Link>

            <Link to="/nations" className="nav-card">
              <div className="nav-card-icon">🌍</div>
              <h3 className="nav-card-title">Nations</h3>
              <p className="nav-card-description">
                Interactive dashboard showing 70/30 vault split and national wealth projections
              </p>
            </Link>

            <Link to="/sentinel" className="nav-card">
              <div className="nav-card-icon">🛡️</div>
              <h3 className="nav-card-title">Sentinel</h3>
              <p className="nav-card-description">
                Explore the $10, $30, and $1,000 lifetime licensing tiers
              </p>
            </Link>
          </div>
        </div>

        {/* System Features */}
        <div className="home-features">
          <h2 className="features-title">Core Principles</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3 className="feature-title">Biometric Sovereignty</h3>
              <p className="feature-description">
                Your identity is secured by 4-layer biometric authentication: Face, Finger, Heart, and Voice.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💎</div>
              <h3 className="feature-title">Economic Empowerment</h3>
              <p className="feature-description">
                Every citizen receives VIDA Cap upon vitalization with 50/50 split between personal vault and national reserve.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📜</div>
              <h3 className="feature-title">Transparent Ledger</h3>
              <p className="feature-description">
                All transactions logged to the Vitalie Truth Ledger (VLT) for complete transparency and verification.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏛️</div>
              <h3 className="feature-title">Monthly Dividend</h3>
              <p className="feature-description">
                Truth-tellers receive equal share of the Global Citizen Block every month through the Monthly Truth Dividend.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="home-footer">
          <p className="footer-text">
            🏛️ <strong>Presence Factor Fabric</strong> — Built by Isreal Okoro (mrfundzman)
          </p>
          <p className="footer-subtext">
            The future of sovereign identity and economic empowerment
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

