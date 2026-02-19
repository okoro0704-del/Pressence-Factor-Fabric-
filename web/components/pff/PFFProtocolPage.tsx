/**
 * PFF Protocol Page
 * 
 * Main page combining all PFF components:
 * - Sovereign Dashboard (real-time balances)
 * - Claim Wealth Button (vitalization)
 * - Convert to Naira Button (swap)
 * 
 * Imperial Minimalist Design
 */

"use client";

import { SovereignDashboard } from "./SovereignDashboard";
import { ClaimWealthButton } from "./ClaimWealthButton";
import { ConvertToNairaButton } from "./ConvertToNairaButton";
import { usePFFBalances } from "@/lib/pff/hooks/usePFFBalances";
import { Shield, Zap } from "lucide-react";

// Nation address to receive 5 VIDA CAP during vitalization
const NATION_ADDRESS = process.env.NEXT_PUBLIC_NATION_ADDRESS || "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4";

export function PFFProtocolPage() {
  const { refetch } = usePFFBalances();

  const handleSuccess = () => {
    // Refetch balances after successful transaction
    setTimeout(() => {
      refetch();
    }, 2000);
  };

  return (
    <div className="pff-protocol-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-icon">
          <Shield size={48} />
        </div>
        <h1 className="hero-title">PFF Sovereign Protocol</h1>
        <p className="hero-subtitle">
          Zero Friction Financial Sovereignty
        </p>
        <div className="hero-features">
          <div className="feature">
            <Zap size={16} />
            <span>No Signups</span>
          </div>
          <div className="feature">
            <Zap size={16} />
            <span>No Passwords</span>
          </div>
          <div className="feature">
            <Zap size={16} />
            <span>No Gas Fees</span>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="dashboard-section">
        <SovereignDashboard />
      </div>

      {/* Actions */}
      <div className="actions-section">
        <div className="action-card">
          <h2 className="action-title">The Handshake</h2>
          <p className="action-description">
            Claim your sovereign wealth allocation
          </p>
          <ClaimWealthButton 
            onSuccess={handleSuccess}
            nationAddress={NATION_ADDRESS}
          />
        </div>

        <div className="action-card">
          <h2 className="action-title">National Exchange</h2>
          <p className="action-description">
            Convert VIDA CAP to Nigerian Naira (ngnVIDA)
          </p>
          <ConvertToNairaButton onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="info-section">
        <div className="info-card">
          <h3>Invisible Wallet</h3>
          <p>
            Your wallet is created automatically in your browser. No setup required.
          </p>
        </div>
        <div className="info-card">
          <h3>Gasless Transactions</h3>
          <p>
            All transactions are sponsored via Account Abstraction (ERC-4337). You never pay gas fees.
          </p>
        </div>
        <div className="info-card">
          <h3>Dual-Vault System</h3>
          <p>
            Every address has spendable (liquid) and locked (collateral) balances for maximum security.
          </p>
        </div>
      </div>

      <style jsx>{`
        .pff-protocol-page {
          min-height: 100vh;
          background: #0a1628;
          padding: 2rem;
        }

        .hero-section {
          text-align: center;
          padding: 3rem 0;
          margin-bottom: 3rem;
        }

        .hero-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
          border-radius: 50%;
          border: 2px solid #d4af37;
          color: #d4af37;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        .hero-features {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          color: #d4af37;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dashboard-section {
          max-width: 1200px;
          margin: 0 auto 3rem;
        }

        .actions-section {
          max-width: 1200px;
          margin: 0 auto 3rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .action-card {
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .action-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .action-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
        }

        .info-section {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .info-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-card p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .actions-section {
            grid-template-columns: 1fr;
          }

          .pff-protocol-page {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

