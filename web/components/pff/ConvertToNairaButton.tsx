/**
 * Convert to Naira Button
 * 
 * Swaps VIDA CAP to ngnVIDA (1:1 with Nigerian Naira)
 * - Gasless transaction via Account Abstraction
 * - Rate: 1 VIDA = 1,345,450 ngnVIDA
 */

"use client";

import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";
import { useState } from "react";
import { PFF_CONTRACTS, NATIONAL_TREASURY_ABI, EXCHANGE_RATES } from "@/lib/pff/contracts";
import { usePFFBalances } from "@/lib/pff/hooks/usePFFBalances";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

interface ConvertToNairaButtonProps {
  onSuccess?: () => void;
}

export function ConvertToNairaButton({ onSuccess }: ConvertToNairaButtonProps) {
  const address = useAddress();
  const { vidaCap, refetch } = usePFFBalances();
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Connect to NationalTreasury contract
  const { contract } = useContract(
    PFF_CONTRACTS.NATIONAL_TREASURY,
    NATIONAL_TREASURY_ABI
  );

  // Prepare swap function
  const { mutateAsync: swapToNaira, isLoading } = useContractWrite(contract, "swapVidaToNgn");

  const handleSwap = async () => {
    if (!address) {
      setErrorMessage("Wallet not connected");
      setStatus("error");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Enter a valid amount");
      setStatus("error");
      return;
    }

    const amountFloat = parseFloat(amount);
    const spendableFloat = parseFloat(vidaCap.spendable.replace(/,/g, ""));

    if (amountFloat > spendableFloat) {
      setErrorMessage("Insufficient spendable balance");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      // Convert amount to wei (18 decimals) - ethers v5 syntax
      const amountWei = ethers.utils.parseEther(amount);

      // Call swapVidaToNgn function (gasless via Account Abstraction)
      const tx = await swapToNaira({
        args: [amountWei],
      });

      console.log("Swap successful:", tx);

      setStatus("success");
      setAmount(""); // Clear input
      
      // Refetch balances
      refetch();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (error: any) {
      console.error("Swap error:", error);
      setErrorMessage(error.message || "Transaction failed");
      setStatus("error");

      // Reset error after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  const calculateNgnVida = () => {
    if (!amount || parseFloat(amount) <= 0) return "0.00";
    const vidaAmount = parseFloat(amount);
    const ngnAmount = vidaAmount * EXCHANGE_RATES.VIDA_TO_NGN;
    return ngnAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const setMaxAmount = () => {
    const maxAmount = vidaCap.spendable.replace(/,/g, "");
    setAmount(maxAmount);
  };

  return (
    <div className="convert-container">
      <div className="convert-header">
        <h3>Convert to National Currency</h3>
        <p className="exchange-rate">1 VIDA = ₦{EXCHANGE_RATES.VIDA_TO_NGN.toLocaleString()}</p>
      </div>

      <div className="input-group">
        <label>Amount (VIDA CAP)</label>
        <div className="input-wrapper">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isLoading || status === "loading"}
            step="0.01"
            min="0"
          />
          <button onClick={setMaxAmount} className="max-button">
            MAX
          </button>
        </div>
        <div className="balance-info">
          Available: {vidaCap.spendable} VIDA CAP
        </div>
      </div>

      <div className="conversion-preview">
        <div className="preview-row">
          <span className="preview-label">You send:</span>
          <span className="preview-value">{amount || "0.00"} VIDA</span>
        </div>
        <ArrowRightLeft className="arrow-icon" size={20} />
        <div className="preview-row">
          <span className="preview-label">You receive:</span>
          <span className="preview-value highlight">₦{calculateNgnVida()} ngnVIDA</span>
        </div>
      </div>

      <button
        onClick={handleSwap}
        disabled={isLoading || status === "loading" || !address || !amount}
        className={`convert-button ${status}`}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Converting...</span>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 size={20} />
            <span>Converted Successfully!</span>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle size={20} />
            <span>Conversion Failed</span>
          </>
        ) : (
          <>
            <ArrowRightLeft size={20} />
            <span>Convert to Naira</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <style jsx>{`
        .convert-container {
          width: 100%;
        }

        .convert-header {
          margin-bottom: 1.5rem;
        }

        .convert-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .exchange-rate {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          gap: 0.5rem;
        }

        .input-wrapper input {
          flex: 1;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .max-button {
          padding: 0 1.25rem;
          background: rgba(212, 175, 55, 0.2);
          border: 1px solid #d4af37;
          border-radius: 8px;
          color: #d4af37;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .max-button:hover {
          background: rgba(212, 175, 55, 0.3);
        }

        .balance-info {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .conversion-preview {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .preview-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .preview-value {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .preview-value.highlight {
          color: #d4af37;
          font-size: 1.125rem;
        }

        .arrow-icon {
          display: block;
          margin: 0.5rem auto;
          color: #d4af37;
        }

        .convert-button {
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

        .convert-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.5);
          background: linear-gradient(135deg, #f0c952 0%, #ffd700 100%);
        }

        .convert-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .convert-button.loading {
          background: linear-gradient(135deg, #8b7a2f 0%, #a89342 100%);
        }

        .convert-button.success {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #ffffff;
        }

        .convert-button.error {
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
      `}</style>
    </div>
  );
}

