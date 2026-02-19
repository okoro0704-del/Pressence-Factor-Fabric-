/**
 * National Portfolio Component
 * 
 * Displays live balances for VIDA CAP and ngnVIDA
 * - Fetches balanceOf for connected user
 * - Applies 18-decimal divisor (ethers.formatUnits)
 * - Deep blue and gold styling
 * - Real-time updates
 */

"use client";

import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { PFF_CONTRACTS, ERC20_ABI } from "@/lib/pff/contracts";
import { ethers } from "ethers";
import { Wallet, Coins, TrendingUp, RefreshCw } from "lucide-react";

/**
 * Format balance from wei to human-readable
 * Applies 18-decimal divisor
 */
function formatBalance(balance: any): string {
  if (!balance) return "0.00";

  try {
    // ethers v5 syntax
    const formatted = ethers.utils.formatUnits(balance, 18);
    const num = parseFloat(formatted);

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("Error formatting balance:", error);
    return "0.00";
  }
}

export function NationalPortfolio() {
  const address = useAddress();

  // ============================================================================
  // CONTRACT CONNECTIONS
  // ============================================================================

  // VIDA CAP Token
  const { contract: vidaCapContract } = useContract(
    PFF_CONTRACTS.VIDA_CAP_TOKEN,
    ERC20_ABI
  );

  // ngnVIDA Token
  const { contract: ngnVidaContract } = useContract(
    PFF_CONTRACTS.NGN_VIDA_TOKEN,
    ERC20_ABI
  );

  // ============================================================================
  // LIVE BALANCE READING
  // ============================================================================

  // Fetch VIDA CAP balance
  const {
    data: vidaCapBalance,
    isLoading: isLoadingVida,
    refetch: refetchVida
  } = useContractRead(
    vidaCapContract,
    "balanceOf",
    [address || ethers.constants.AddressZero]
  );

  // Fetch ngnVIDA balance
  const {
    data: ngnVidaBalance,
    isLoading: isLoadingNgn,
    refetch: refetchNgn
  } = useContractRead(
    ngnVidaContract,
    "balanceOf",
    [address || ethers.constants.AddressZero]
  );

  // ============================================================================
  // REFRESH HANDLER
  // ============================================================================

  const handleRefresh = () => {
    refetchVida();
    refetchNgn();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!address) {
    return (
      <div className="national-portfolio connecting">
        <div className="connecting-message">
          <Wallet size={32} />
          <p>Connecting to National Treasury...</p>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingVida || isLoadingNgn;

  return (
    <div className="national-portfolio">
      {/* Header */}
      <div className="portfolio-header">
        <div className="header-content">
          <TrendingUp className="header-icon" size={28} />
          <h2 className="portfolio-title">National Portfolio</h2>
        </div>
        <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
          <RefreshCw className={isLoading ? "spinning" : ""} size={20} />
        </button>
      </div>

      {/* Balance Cards */}
      <div className="balance-grid">
        {/* VIDA CAP Balance */}
        <div className="balance-card vida-cap">
          <div className="card-header">
            <Wallet className="card-icon" size={24} />
            <span className="card-label">VIDA CAP</span>
          </div>
          <div className="card-balance">
            {isLoadingVida ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <span className="balance-amount">{formatBalance(vidaCapBalance)}</span>
                <span className="balance-unit">VIDA</span>
              </>
            )}
          </div>
          <div className="card-address">
            {PFF_CONTRACTS.VIDA_CAP_TOKEN.slice(0, 6)}...{PFF_CONTRACTS.VIDA_CAP_TOKEN.slice(-4)}
          </div>
        </div>

        {/* ngnVIDA Balance */}
        <div className="balance-card ngn-vida">
          <div className="card-header">
            <Coins className="card-icon" size={24} />
            <span className="card-label">ngnVIDA</span>
          </div>
          <div className="card-balance">
            {isLoadingNgn ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <span className="balance-amount">{formatBalance(ngnVidaBalance)}</span>
                <span className="balance-unit">₦</span>
              </>
            )}
          </div>
          <div className="card-address">
            {PFF_CONTRACTS.NGN_VIDA_TOKEN.slice(0, 6)}...{PFF_CONTRACTS.NGN_VIDA_TOKEN.slice(-4)}
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="exchange-info">
        <p>Exchange Rate: 1 VIDA CAP = ₦1,345,450 ngnVIDA</p>
      </div>

      <style jsx>{`
        .national-portfolio {
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(212, 175, 55, 0.3);
        }

        .national-portfolio.connecting {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .connecting-message {
          text-align: center;
          color: #d4af37;
        }

        .connecting-message p {
          margin-top: 1rem;
          font-size: 1.125rem;
        }

        .portfolio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.2);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          color: #d4af37;
        }

        .portfolio-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .refresh-button {
          padding: 0.75rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid #d4af37;
          border-radius: 8px;
          color: #d4af37;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover:not(:disabled) {
          background: rgba(212, 175, 55, 0.2);
          transform: rotate(90deg);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .balance-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.75rem;
          border: 2px solid rgba(212, 175, 55, 0.3);
          transition: all 0.3s ease;
        }

        .balance-card:hover {
          transform: translateY(-4px);
          border-color: #d4af37;
          box-shadow: 0 12px 32px rgba(212, 175, 55, 0.2);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .card-icon {
          color: #d4af37;
        }

        .card-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .card-balance {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          margin-bottom: 1rem;
          min-height: 3.5rem;
        }

        .balance-amount {
          font-size: 2.25rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .balance-unit {
          font-size: 1.25rem;
          color: #d4af37;
          font-weight: 600;
        }

        .card-address {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: "Courier New", monospace;
        }

        .loading-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .exchange-info {
          background: rgba(212, 175, 55, 0.1);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .exchange-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #d4af37;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .national-portfolio {
            padding: 1.5rem;
          }

          .portfolio-title {
            font-size: 1.25rem;
          }

          .balance-grid {
            grid-template-columns: 1fr;
          }

          .balance-amount {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

