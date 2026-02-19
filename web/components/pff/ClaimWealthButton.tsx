/**
 * Claim Wealth Button
 * 
 * Triggers vitalization (11-unit VIDA CAP distribution)
 * - Gasless transaction via Account Abstraction
 * - Imperial Minimalist design
 */

"use client";

import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";
import { useState } from "react";
import { PFF_CONTRACTS, FOUNDATION_VAULT_ABI } from "@/lib/pff/contracts";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface ClaimWealthButtonProps {
  onSuccess?: () => void;
  nationAddress?: string; // Address to receive nation's share (5 VIDA CAP)
}

export function ClaimWealthButton({ onSuccess, nationAddress }: ClaimWealthButtonProps) {
  const address = useAddress();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Connect to FoundationVault contract
  const { contract } = useContract(
    PFF_CONTRACTS.FOUNDATION_VAULT,
    FOUNDATION_VAULT_ABI
  );

  // Prepare vitalize function
  const { mutateAsync: vitalize, isLoading } = useContractWrite(contract, "vitalize");

  const handleClaimWealth = async () => {
    if (!address) {
      setErrorMessage("Wallet not connected");
      setStatus("error");
      return;
    }

    if (!nationAddress) {
      setErrorMessage("Nation address not configured");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      // Call vitalize function (gasless via Account Abstraction)
      const tx = await vitalize({
        args: [address, nationAddress], // _citizen, _nation
      });

      console.log("Vitalization successful:", tx);

      // Trigger confetti animation
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#F0C952", "#FFD700"],
      });

      setStatus("success");
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (error: any) {
      console.error("Vitalization error:", error);
      setErrorMessage(error.message || "Transaction failed");
      setStatus("error");

      // Reset error after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Claiming Sovereign Wealth...</span>
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 size={20} />
            <span>Wealth Claimed Successfully!</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle size={20} />
            <span>Claim Failed</span>
          </>
        );
      default:
        return (
          <>
            <Sparkles size={20} />
            <span>Claim Wealth</span>
          </>
        );
    }
  };

  return (
    <div className="claim-wealth-container">
      <button
        onClick={handleClaimWealth}
        disabled={isLoading || status === "loading" || !address}
        className={`claim-wealth-button ${status}`}
      >
        {getButtonContent()}
      </button>

      {errorMessage && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="claim-info">
        <p>Receive 11 VIDA CAP distributed as:</p>
        <ul>
          <li>5 VIDA CAP to you (1 spendable + 4 locked)</li>
          <li>5 VIDA CAP to nation (1 spendable + 4 locked)</li>
          <li>~0.1 VIDA CAP to sentinel ($100 USD)</li>
          <li>~0.9 VIDA CAP to foundation (hardlocked)</li>
        </ul>
      </div>

      <style jsx>{`
        .claim-wealth-container {
          width: 100%;
        }

        .claim-wealth-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.25rem 2rem;
          background: linear-gradient(135deg, #d4af37 0%, #f0c952 100%);
          color: #0a1628;
          border: none;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
        }

        .claim-wealth-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.5);
          background: linear-gradient(135deg, #f0c952 0%, #ffd700 100%);
        }

        .claim-wealth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .claim-wealth-button.loading {
          background: linear-gradient(135deg, #8b7a2f 0%, #a89342 100%);
        }

        .claim-wealth-button.success {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #ffffff;
        }

        .claim-wealth-button.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.875rem;
        }

        .claim-info {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .claim-info p {
          color: #d4af37;
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .claim-info ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .claim-info li {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .claim-info li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #d4af37;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

