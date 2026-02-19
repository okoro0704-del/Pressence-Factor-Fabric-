/**
 * PFF Dashboard - Complete Integration
 * 
 * Combines all PFF Protocol components:
 * - ConnectButton with embeddedWallet (Guest/Auto-Connect)
 * - National Portfolio (live balances)
 * - Vitalize button (calls FoundationVault)
 * - Swap button (calls NationalTreasury)
 * - All transactions are gasless via Account Abstraction
 */

"use client";

import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { NationalPortfolio } from "./NationalPortfolio";
import { ClaimWealthButton } from "./ClaimWealthButton";
import { ConvertToNairaButton } from "./ConvertToNairaButton";
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";
import { Shield, Zap, Lock } from "lucide-react";

// Nation address to receive 5 VIDA CAP during vitalization
const NATION_ADDRESS = process.env.NEXT_PUBLIC_NATION_ADDRESS || "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4";

export function PFFDashboard() {
  const address = useAddress();
  const { refreshBalances } = usePFFSovereign();

  const handleSuccess = () => {
    // Refresh balances after successful transaction
    setTimeout(() => {
      refreshBalances();
    }, 2000);
  };

  return (
    <div className="pff-dashboard">
      {/* Header with Connect Button */}
      <div className="dashboard-header">
        <div className="header-content">
          <Shield className="header-icon" size={40} />
          <div className="header-text">
            <h1 className="header-title">PFF Protocol</h1>
            <p className="header-subtitle">Sovereign Financial System</p>
          </div>
        </div>
        
        {/* ConnectButton with Embedded Wallet (Guest Mode) */}
        <ConnectWallet
          theme="dark"
          btnTitle="Enter Protocol"
          modalTitle="PFF Sovereign Access"
          modalSize="compact"
          welcomeScreen={{
            title: "Welcome to PFF Protocol",
            subtitle: "Zero friction. Zero signups. Zero gas fees.",
          }}
        />
      </div>

      {/* Features Banner */}
      <div className="features-banner">
        <div className="feature">
          <Zap size={18} />
          <span>No Signups</span>
        </div>
        <div className="feature">
          <Zap size={18} />
          <span>No Passwords</span>
        </div>
        <div className="feature">
          <Zap size={18} />
          <span>No Gas Fees</span>
        </div>
        <div className="feature">
          <Lock size={18} />
          <span>Account Abstraction</span>
        </div>
      </div>

      {address ? (
        <>
          {/* National Portfolio - Live Balances */}
          <div className="portfolio-section">
            <NationalPortfolio />
          </div>

          {/* Action Buttons */}
          <div className="actions-section">
            {/* Vitalize Button - Calls FoundationVault */}
            <div className="action-card">
              <h3 className="action-title">The Handshake</h3>
              <p className="action-description">
                Claim your sovereign wealth allocation (11 VIDA CAP)
              </p>
              <ClaimWealthButton 
                onSuccess={handleSuccess}
                nationAddress={NATION_ADDRESS}
              />
            </div>

            {/* Swap Button - Calls NationalTreasury */}
            <div className="action-card">
              <h3 className="action-title">National Exchange</h3>
              <p className="action-description">
                Convert VIDA CAP to Nigerian Naira (ngnVIDA)
              </p>
              <ConvertToNairaButton onSuccess={handleSuccess} />
            </div>
          </div>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-card">
              <h4>Smart Contracts</h4>
              <ul>
                <li>VIDA CAP: 0xDc6E...12E</li>
                <li>ngnVIDA: 0x5dD4...811</li>
                <li>FoundationVault: 0xD42C...2E0</li>
                <li>NationalTreasury: 0x5E84...bF4</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>Gasless Transactions</h4>
              <p>
                All transactions use Account Abstraction (ERC-4337). 
                A Paymaster sponsors your gas fees. You never pay.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="connect-prompt">
          <Shield size={64} />
          <h2>Connect to Access Your National Portfolio</h2>
          <p>Click "Enter Protocol" above to create your invisible wallet</p>
        </div>
      )}

      <style jsx>{`
        .pff-dashboard {
          min-height: 100vh;
          background: #0a1628;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #1a2942 0%, #0a1628 100%);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          color: #d4af37;
        }

        .header-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #d4af37;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .header-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0.25rem 0 0 0;
        }

        .features-banner {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          padding: 1rem;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          color: #d4af37;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .portfolio-section {
          margin-bottom: 2rem;
        }

        .actions-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .action-card {
          background: linear-gradient(135deg, #1a2942 0%, #0a1628 100%);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .action-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #d4af37;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .action-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 1.5rem 0;
        }

        .info-section {
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

        .info-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #d4af37;
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          padding: 0.5rem 0;
          font-family: "Courier New", monospace;
        }

        .info-card p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin: 0;
        }

        .connect-prompt {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .connect-prompt h2 {
          color: #d4af37;
          margin: 1.5rem 0 1rem 0;
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .pff-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
          }

          .actions-section {
            grid-template-columns: 1fr;
          }

          .features-banner {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

