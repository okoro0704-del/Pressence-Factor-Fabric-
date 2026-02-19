/**
 * Sovereign Dashboard
 * 
 * Real-time balance display with Imperial Minimalist design
 * - Deep Midnight Blue background
 * - Brushed Gold accents (#D4AF37)
 * - Clean, authoritative typography
 */

"use client";

import { useAddress } from "@thirdweb-dev/react";
import { usePFFBalances } from "@/lib/pff/hooks/usePFFBalances";
import { Loader2, Wallet, Lock, Coins } from "lucide-react";

export function SovereignDashboard() {
  const address = useAddress();
  const { vidaCap, ngnVida, isLoading, error, refetch } = usePFFBalances();

  if (!address) {
    return (
      <div className="sovereign-dashboard connecting">
        <div className="status-indicator">
          <Loader2 className="animate-spin" size={24} />
          <p>Establishing Sovereign Connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sovereign-dashboard error">
        <div className="error-message">
          <p>Unable to retrieve sovereign assets</p>
          <button onClick={refetch} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sovereign-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Sovereign Treasury</h1>
        <p className="wallet-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>

      {/* Asset Cards */}
      <div className="asset-grid">
        {/* VIDA CAP - Spendable */}
        <div className="asset-card primary">
          <div className="asset-header">
            <Wallet className="asset-icon" size={28} />
            <span className="asset-label">VIDA CAP</span>
          </div>
          <div className="asset-balance">
            {isLoading ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <>
                <span className="balance-amount">{vidaCap.spendable}</span>
                <span className="balance-unit">VIDA</span>
              </>
            )}
          </div>
          <div className="asset-subtitle">Spendable Balance</div>
        </div>

        {/* VIDA CAP - Locked (Collateral) */}
        <div className="asset-card secondary">
          <div className="asset-header">
            <Lock className="asset-icon" size={28} />
            <span className="asset-label">Collateral</span>
          </div>
          <div className="asset-balance">
            {isLoading ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <>
                <span className="balance-amount">{vidaCap.locked}</span>
                <span className="balance-unit">VIDA</span>
              </>
            )}
          </div>
          <div className="asset-subtitle">Locked Balance</div>
        </div>

        {/* ngnVIDA - National Currency */}
        <div className="asset-card tertiary">
          <div className="asset-header">
            <Coins className="asset-icon" size={28} />
            <span className="asset-label">ngnVIDA</span>
          </div>
          <div className="asset-balance">
            {isLoading ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <>
                <span className="balance-amount">{ngnVida.balance}</span>
                <span className="balance-unit">NGN</span>
              </>
            )}
          </div>
          <div className="asset-subtitle">National Currency (₦)</div>
        </div>
      </div>

      {/* Total Wealth */}
      <div className="total-wealth">
        <div className="wealth-label">Total Sovereign Wealth</div>
        <div className="wealth-amount">
          {isLoading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <span className="amount">{vidaCap.total}</span>
              <span className="unit">VIDA CAP</span>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .sovereign-dashboard {
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .dashboard-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .wallet-address {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-family: "Courier New", monospace;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .asset-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(212, 175, 55, 0.3);
          transition: all 0.3s ease;
        }

        .asset-card:hover {
          transform: translateY(-4px);
          border-color: #d4af37;
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2);
        }

        .asset-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .asset-icon {
          color: #d4af37;
        }

        .asset-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .asset-balance {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .balance-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .balance-unit {
          font-size: 1rem;
          color: #d4af37;
          font-weight: 600;
        }

        .asset-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .total-wealth {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid rgba(212, 175, 55, 0.4);
        }

        .wealth-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .wealth-amount {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.75rem;
        }

        .wealth-amount .amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #d4af37;
        }

        .wealth-amount .unit {
          font-size: 1.25rem;
          color: rgba(212, 175, 55, 0.8);
          font-weight: 600;
        }

        .status-indicator,
        .error-message {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .retry-button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #d4af37;
          color: #0a1628;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          background: #f0c952;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

