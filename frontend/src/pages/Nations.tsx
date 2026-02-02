/**
 * PFF Frontend — Nations Page
 * Interactive dashboard showing 70/30 vault split and national dividend projections
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState } from 'react';
import CountdownClock from '../components/CountdownClock';

export const Nations: React.FC = () => {
  const [population, setPopulation] = useState<number>(1000000); // Default 1 million

  // Projection Engine Calculation
  // Pop * 10 VIDA CAP * 0.5 (Nation's Share)
  const totalVidaCap = population * 10;
  const nationShare = totalVidaCap * 0.5;
  const citizenShare = totalVidaCap * 0.5;

  // 70/30 Split (from Nation's Share)
  const nationalReserve = nationShare * 0.7; // 70% to National Reserve
  const nationalEscrow = nationShare * 0.3; // 30% to National Escrow

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const formatExact = (num: number): string => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="sovereign-portal">
      <div className="page-container">
        <CountdownClock variant="compact" showTitle={false} />
        
        <div className="page-header">
          <h1 className="page-title">🌍 National Wealth Projection</h1>
          <p className="page-subtitle">
            Interactive dashboard showing the 70/30 vault split and national dividend projections
          </p>
        </div>

        {/* Projection Engine */}
        <div className="projection-engine">
          <h2 className="projection-title">📊 Projection Engine</h2>
          
          <div className="population-slider-container">
            <label className="slider-label">
              <span className="slider-label-text">National Population:</span>
              <span className="slider-value">{formatExact(population)}</span>
            </label>
            
            <input
              type="range"
              min="10000"
              max="1000000000"
              step="10000"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="population-slider"
            />
            
            <div className="slider-markers">
              <span>10K</span>
              <span>1M</span>
              <span>10M</span>
              <span>100M</span>
              <span>1B</span>
            </div>
          </div>

          <div className="projection-formula">
            <h3 className="formula-title">Calculation Formula:</h3>
            <div className="formula-display">
              <code>
                Population × 10 VIDA CAP × 0.5 (Nation's Share) = {formatNumber(nationShare)} VIDA CAP
              </code>
            </div>
          </div>
        </div>

        {/* Wealth Breakdown */}
        <div className="wealth-breakdown">
          <h2 className="breakdown-title">💎 National Wealth Breakdown</h2>
          
          <div className="breakdown-grid">
            <div className="breakdown-card total">
              <div className="breakdown-icon">🌟</div>
              <h3 className="breakdown-card-title">Total VIDA Cap Minted</h3>
              <div className="breakdown-value">{formatNumber(totalVidaCap)}</div>
              <div className="breakdown-exact">{formatExact(totalVidaCap)} VIDA CAP</div>
            </div>

            <div className="breakdown-card nation">
              <div className="breakdown-icon">🏛️</div>
              <h3 className="breakdown-card-title">Nation's Share (50%)</h3>
              <div className="breakdown-value">{formatNumber(nationShare)}</div>
              <div className="breakdown-exact">{formatExact(nationShare)} VIDA CAP</div>
            </div>

            <div className="breakdown-card citizen">
              <div className="breakdown-icon">👥</div>
              <h3 className="breakdown-card-title">Citizens' Share (50%)</h3>
              <div className="breakdown-value">{formatNumber(citizenShare)}</div>
              <div className="breakdown-exact">{formatExact(citizenShare)} VIDA CAP</div>
            </div>
          </div>
        </div>

        {/* 70/30 Vault Split */}
        <div className="vault-split">
          <h2 className="vault-title">🏦 70/30 Vault Split (Nation's Share)</h2>
          
          <div className="vault-grid">
            <div className="vault-card reserve">
              <div className="vault-header">
                <div className="vault-icon">🏦</div>
                <h3 className="vault-name">National Reserve</h3>
                <div className="vault-percentage">70%</div>
              </div>
              
              <div className="vault-amount">{formatNumber(nationalReserve)}</div>
              <div className="vault-exact">{formatExact(nationalReserve)} VIDA CAP</div>
              
              <div className="vault-description">
                <p>
                  Liquidity backing for $VIDA currency. Ensures 1:1 backing ratio for all spendable VIDA in circulation.
                </p>
              </div>
            </div>

            <div className="vault-card escrow">
              <div className="vault-header">
                <div className="vault-icon">🔒</div>
                <h3 className="vault-name">National Escrow</h3>
                <div className="vault-percentage">30%</div>
              </div>
              
              <div className="vault-amount">{formatNumber(nationalEscrow)}</div>
              <div className="vault-exact">{formatExact(nationalEscrow)} VIDA CAP</div>
              
              <div className="vault-description">
                <p>
                  Receives 0.5% from Sentinel activations. Provides additional liquidity backing and emergency reserves.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Citizen Breakdown */}
        <div className="per-citizen">
          <h2 className="per-citizen-title">👤 Per-Citizen Allocation</h2>
          
          <div className="per-citizen-grid">
            <div className="per-citizen-card">
              <div className="per-citizen-label">VIDA Cap per Citizen</div>
              <div className="per-citizen-value">10.00</div>
            </div>

            <div className="per-citizen-card">
              <div className="per-citizen-label">Citizen Vault</div>
              <div className="per-citizen-value">5.00</div>
            </div>

            <div className="per-citizen-card">
              <div className="per-citizen-label">National Reserve</div>
              <div className="per-citizen-value">3.50</div>
            </div>

            <div className="per-citizen-card">
              <div className="per-citizen-label">National Escrow</div>
              <div className="per-citizen-value">1.50</div>
            </div>
          </div>
        </div>

        <div className="nations-footer">
          <p className="nations-footer-text">
            🌍 <strong>National Wealth Projection</strong> — Building sovereign economies, one citizen at a time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Nations;

