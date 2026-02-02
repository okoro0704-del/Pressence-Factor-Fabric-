/**
 * PFF Frontend — Sentinel Page
 * Details on the $10, $30, and $1,000 tiers
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import CountdownClock from '../components/CountdownClock';
import { isStasisLocked, STASIS_LOCK_MESSAGE } from '../utils/stasisLock';

interface SentinelTier {
  tier: number;
  name: string;
  price: number;
  devices: number;
  icon: string;
  color: string;
  features: string[];
  revenueBreakdown: {
    architect: number;
    nationalEscrow: number;
    globalCitizenBlock: number;
  };
}

const sentinelTiers: SentinelTier[] = [
  {
    tier: 1,
    name: 'Citizen',
    price: 10.00,
    devices: 1,
    icon: '👤',
    color: '#6b4ce6',
    features: [
      'Lifetime Sentinel activation for 1 device',
      'Hardware-bound license (non-transferable)',
      'Full 4-layer biometric handshake protection',
      'Access to Monthly Truth Dividend',
      'Fortress-level security status',
      'VLT transparency logging',
    ],
    revenueBreakdown: {
      architect: 9.90,
      nationalEscrow: 0.05,
      globalCitizenBlock: 0.05,
    },
  },
  {
    tier: 2,
    name: 'Personal Multi',
    price: 30.00,
    devices: 5,
    icon: '👥',
    color: '#d946ef',
    features: [
      'Lifetime Sentinel activation for up to 5 devices',
      'Seat management UI for device binding/revocation',
      'Hardware-bound licenses (non-transferable)',
      'Full 4-layer biometric handshake protection',
      'Access to Monthly Truth Dividend',
      'Fortress-level security status',
      'VLT transparency logging',
      'Multi-device synchronization',
    ],
    revenueBreakdown: {
      architect: 29.70,
      nationalEscrow: 0.15,
      globalCitizenBlock: 0.15,
    },
  },
  {
    tier: 3,
    name: 'Enterprise',
    price: 1000.00,
    devices: 20,
    icon: '🏢',
    color: '#fbbf24',
    features: [
      'Lifetime Sentinel activation for up to 20 devices',
      'Advanced seat management UI with admin controls',
      'Hardware-bound licenses (non-transferable)',
      'Full 4-layer biometric handshake protection',
      'Access to Monthly Truth Dividend',
      'Fortress-level security status',
      'VLT transparency logging',
      'Multi-device synchronization',
      'Priority support and onboarding',
      'Enterprise-grade audit trail',
    ],
    revenueBreakdown: {
      architect: 990.00,
      nationalEscrow: 5.00,
      globalCitizenBlock: 5.00,
    },
  },
];

export const Sentinel: React.FC = () => {
  const locked = isStasisLocked();

  return (
    <div className="sovereign-portal">
      <div className="page-container">
        <CountdownClock variant="compact" showTitle={false} />
        
        <div className="page-header">
          <h1 className="page-title">🛡️ Sentinel Licensing</h1>
          <p className="page-subtitle">
            Lifetime hardware-bound security with tiered device support
          </p>
        </div>

        {/* Sentinel Overview */}
        <div className="sentinel-overview">
          <h2 className="overview-title">What is Sentinel?</h2>
          <p className="overview-description">
            Sentinel is the <strong>Fortress-level security layer</strong> that wraps your PFF identity with 
            hardware-bound protection. Once activated, your device becomes a permanent validator in the 
            Sovereign network, with lifetime access to the Monthly Truth Dividend.
          </p>
          
          <div className="overview-features">
            <div className="overview-feature">
              <div className="overview-feature-icon">🔒</div>
              <div className="overview-feature-text">
                <strong>Hardware-Bound:</strong> License cannot be transferred to another device
              </div>
            </div>
            
            <div className="overview-feature">
              <div className="overview-feature-icon">♾️</div>
              <div className="overview-feature-text">
                <strong>Lifetime Validity:</strong> One-time payment, no expiration date
              </div>
            </div>
            
            <div className="overview-feature">
              <div className="overview-feature-icon">💰</div>
              <div className="overview-feature-text">
                <strong>Monthly Dividend:</strong> Receive equal share of 0.5% protocol pull
              </div>
            </div>
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="sentinel-tiers">
          <h2 className="tiers-title">Choose Your Tier</h2>
          
          <div className="tiers-grid">
            {sentinelTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`tier-card tier-${tier.tier}`}
                style={{ '--tier-color': tier.color } as React.CSSProperties}
              >
                <div className="tier-header">
                  <div className="tier-icon">{tier.icon}</div>
                  <h3 className="tier-name">Tier {tier.tier}: {tier.name}</h3>
                </div>

                <div className="tier-price">
                  <span className="tier-price-currency">$</span>
                  <span className="tier-price-amount">{tier.price.toFixed(2)}</span>
                  <span className="tier-price-label">USD</span>
                </div>

                <div className="tier-devices">
                  <strong>{tier.devices}</strong> {tier.devices === 1 ? 'Device' : 'Devices'}
                </div>

                <div className="tier-features">
                  <h4 className="tier-features-title">Features:</h4>
                  <ul className="tier-features-list">
                    {tier.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="tier-revenue">
                  <h4 className="tier-revenue-title">Revenue Split (1% Sovereign Movement):</h4>
                  <div className="tier-revenue-breakdown">
                    <div className="tier-revenue-item">
                      <span className="tier-revenue-label">Architect (99%):</span>
                      <span className="tier-revenue-value">${tier.revenueBreakdown.architect.toFixed(2)}</span>
                    </div>
                    <div className="tier-revenue-item">
                      <span className="tier-revenue-label">National Escrow (0.5%):</span>
                      <span className="tier-revenue-value">${tier.revenueBreakdown.nationalEscrow.toFixed(2)}</span>
                    </div>
                    <div className="tier-revenue-item">
                      <span className="tier-revenue-label">Global Citizen Block (0.5%):</span>
                      <span className="tier-revenue-value">${tier.revenueBreakdown.globalCitizenBlock.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className={`tier-activate-button ${locked ? 'locked' : ''}`}
                  disabled={locked}
                  title={locked ? STASIS_LOCK_MESSAGE : `Activate Tier ${tier.tier}`}
                >
                  {locked ? '🔒 Locked until Unveiling' : `Activate Tier ${tier.tier}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Gating Notice */}
        <div className="sentinel-notice">
          <h3 className="notice-title">⚡ Payment Gating Protocol</h3>
          <p className="notice-description">
            Payment is ONLY triggered after 100% successful 4-layer handshake completion. 
            If any biometric phase fails, no charge is made and the activation is aborted.
          </p>
        </div>

        <div className="sentinel-footer">
          <p className="sentinel-footer-text">
            🛡️ <strong>Sentinel Licensing</strong> — Your fortress, your sovereignty, your lifetime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sentinel;

