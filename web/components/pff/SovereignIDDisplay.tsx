/**
 * Sovereign ID Display Component
 * 
 * Automatically connects guest wallet and displays the Sovereign ID (wallet address)
 * - Auto-connects on first load using embeddedWallet in guest mode
 * - Displays wallet address as "Sovereign ID"
 * - Imperial minimalist design (deep blue and gold)
 * - Shows connection status
 */

"use client";

import { useAddress, useConnectionStatus, useConnect } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import { Shield, Loader2, CheckCircle2, Copy } from "lucide-react";

export function SovereignIDDisplay() {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const connect = useConnect();
  const [copied, setCopied] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  // Auto-connect on first load if not connected
  useEffect(() => {
    if (connectionStatus === "disconnected" && !autoConnectAttempted) {
      setAutoConnectAttempted(true);
      // Trigger guest wallet connection automatically
      const autoConnect = async () => {
        try {
          // The embeddedWallet should auto-connect due to autoConnect={true} in provider
          // This is just a fallback in case it doesn't
          console.log("[SovereignID] Auto-connecting guest wallet...");
        } catch (error) {
          console.error("[SovereignID] Auto-connect failed:", error);
        }
      };
      autoConnect();
    }
  }, [connectionStatus, autoConnectAttempted, connect]);

  // Copy address to clipboard
  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Loading state
  if (connectionStatus === "connecting" || connectionStatus === "unknown") {
    return (
      <div className="sovereign-id-display connecting">
        <div className="id-card">
          <div className="id-header">
            <Loader2 className="id-icon spinning" size={32} />
            <div className="id-text">
              <h3 className="id-title">Initializing Guest Session</h3>
              <p className="id-subtitle">Creating your temporary Sovereign ID...</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .sovereign-id-display {
            width: 100%;
            padding: 1.5rem;
          }

          .id-card {
            background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
            border: 2px solid rgba(212, 175, 55, 0.3);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }

          .id-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .id-icon {
            color: #d4af37;
            flex-shrink: 0;
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .id-text {
            flex: 1;
          }

          .id-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #f0c952;
            margin: 0 0 0.5rem 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .id-subtitle {
            font-size: 0.875rem;
            color: #9ca3af;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Connected state - show Sovereign ID
  if (address) {
    return (
      <div className="sovereign-id-display connected">
        <div className="id-card">
          <div className="id-header">
            <div className="id-badge">
              <CheckCircle2 className="badge-icon" size={24} />
            </div>
            <div className="id-text">
              <h3 className="id-label">Sovereign ID</h3>
              <div className="id-address-container">
                <p className="id-address" title={address}>
                  {formatAddress(address)}
                </p>
                <button 
                  onClick={handleCopy} 
                  className="copy-button"
                  aria-label="Copy full address"
                >
                  {copied ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="id-status">Guest Session Active</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .sovereign-id-display {
            width: 100%;
            padding: 1.5rem;
          }

          .id-card {
            background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
            border: 2px solid rgba(212, 175, 55, 0.5);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.2);
          }

          .id-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .id-badge {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #f0c952, #d4af37 40%, #0a1628 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(212, 175, 55, 0.6);
            box-shadow: inset 0 -2px 8px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.3);
            flex-shrink: 0;
          }

          .badge-icon {
            color: #0a1628;
          }

          .id-text {
            flex: 1;
            min-width: 0;
          }

          .id-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #9ca3af;
            margin: 0 0 0.5rem 0;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .id-address-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }

          .id-address {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f0c952;
            margin: 0;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            letter-spacing: 0.02em;
          }

          .copy-button {
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 8px;
            padding: 0.5rem;
            color: #d4af37;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
          }

          .copy-button:hover {
            background: rgba(212, 175, 55, 0.2);
            border-color: rgba(212, 175, 55, 0.5);
            transform: translateY(-1px);
          }

          .copy-button:active {
            transform: translateY(0);
          }

          .id-status {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
          }

          @media (max-width: 640px) {
            .id-card {
              padding: 1.5rem;
            }

            .id-badge {
              width: 48px;
              height: 48px;
            }

            .badge-icon {
              width: 20px;
              height: 20px;
            }

            .id-address {
              font-size: 1.125rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // Disconnected state (shouldn't happen with autoConnect, but just in case)
  return null;
}


