/**
 * Sovereign Verified Badge Component
 * 
 * Checks if the user owns the PFF Verified SBT (Soul-Bound Token)
 * - If they own the token: Display gold "Sovereign Verified" badge
 * - If they don't own it: Show "Complete KYC" button
 * - Uses ERC721 balanceOf to check ownership
 */

"use client";

import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

// PFF Verified SBT Contract Address (Soul-Bound Token)
// This should be set in your .env.local file
const PFF_VERIFIED_SBT_ADDRESS = 
  process.env.NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS || 
  "0x0000000000000000000000000000000000000000"; // Placeholder

// ERC721 ABI for balanceOf (minimal interface for SBT)
const SBT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface SovereignVerifiedBadgeProps {
  onKYCClick?: () => void;
}

export function SovereignVerifiedBadge({ onKYCClick }: SovereignVerifiedBadgeProps) {
  const address = useAddress();
  const [isHovered, setIsHovered] = useState(false);

  // Connect to PFF Verified SBT contract
  const { contract } = useContract(PFF_VERIFIED_SBT_ADDRESS, SBT_ABI);

  // Check if user owns the SBT (balanceOf > 0)
  const { data: balance, isLoading, error } = useContractRead(
    contract,
    "balanceOf",
    [address || "0x0000000000000000000000000000000000000000"]
  );

  // Handle KYC button click
  const handleKYCClick = () => {
    if (onKYCClick) {
      onKYCClick();
    } else {
      // Default behavior: Open KYC page or modal
      console.log("[SovereignVerifiedBadge] KYC button clicked - implement KYC flow");
      // You can redirect to a KYC page or open a modal here
      // window.location.href = "/kyc";
    }
  };

  // Don't render if no wallet connected
  if (!address) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="sovereign-verified-badge loading">
        <div className="badge-content">
          <div className="loading-spinner" />
          <span className="badge-text">Checking verification...</span>
        </div>

        <style jsx>{`
          .sovereign-verified-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .badge-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: rgba(107, 107, 112, 0.1);
            border: 1px solid rgba(107, 107, 112, 0.3);
          }

          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(107, 107, 112, 0.3);
            border-top-color: #6b6b70;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .badge-text {
            font-size: 0.875rem;
            color: #6b6b70;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  // Error state (contract not found or error reading)
  if (error || !contract) {
    return null; // Silently fail if SBT contract not configured
  }

  // Parse balance (BigNumber to number)
  const hasVerifiedSBT = balance && balance.toString() !== "0";

  // User owns the SBT - show Sovereign Verified badge
  if (hasVerifiedSBT) {
    return (
      <div className="sovereign-verified-badge verified">
        <div className="verified-badge-content">
          <CheckCircle2 className="verified-icon" size={20} />
          <span className="verified-text">Sovereign Verified</span>
        </div>

        <style jsx>{`
          .sovereign-verified-badge {
            display: inline-flex;
            align-items: center;
          }

          .verified-badge-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(240, 201, 82, 0.1));
            border: 1px solid rgba(212, 175, 55, 0.5);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
          }

          .verified-icon {
            color: #d4af37;
            flex-shrink: 0;
          }

          .verified-text {
            font-size: 0.875rem;
            color: #f0c952;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          @media (max-width: 640px) {
            .verified-badge-content {
              padding: 0.375rem 0.75rem;
            }

            .verified-icon {
              width: 18px;
              height: 18px;
            }

            .verified-text {
              font-size: 0.75rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // User doesn't own the SBT - show Complete KYC button
  return (
    <div className="sovereign-verified-badge unverified">
      <button
        onClick={handleKYCClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="kyc-button"
      >
        <AlertCircle className="kyc-icon" size={20} />
        <span className="kyc-text">Complete KYC</span>
      </button>

      <style jsx>{`
        .sovereign-verified-badge {
          display: inline-flex;
          align-items: center;
        }

        .kyc-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: ${isHovered
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(240, 201, 82, 0.08))'
            : 'rgba(212, 175, 55, 0.1)'};
          border: 1px solid ${isHovered ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.3)'};
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          font-family: inherit;
        }

        .kyc-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
        }

        .kyc-button:active {
          transform: translateY(0);
        }

        .kyc-icon {
          color: #d4af37;
          flex-shrink: 0;
        }

        .kyc-text {
          font-size: 0.875rem;
          color: #d4af37;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 640px) {
          .kyc-button {
            padding: 0.375rem 0.75rem;
          }

          .kyc-icon {
            width: 18px;
            height: 18px;
          }

          .kyc-text {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}


