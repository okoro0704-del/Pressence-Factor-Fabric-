/**
 * Sovereign Verified Badge Component
 *
 * Checks if the user is vitalized in the database
 * - If vitalized: Display gold "Sovereign Verified" badge
 * - If not vitalized: Show "Complete KYC" button
 * - Uses Supabase database query instead of NFT ownership
 */

"use client";

import { useAddress } from "@thirdweb-dev/react";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SovereignVerifiedBadgeProps {
  onKYCClick?: () => void;
}

export function SovereignVerifiedBadge({ onKYCClick }: SovereignVerifiedBadgeProps) {
  const address = useAddress();
  const [isHovered, setIsHovered] = useState(false);
  const [isVitalized, setIsVitalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check vitalization status from database
  useEffect(() => {
    async function checkVitalizationStatus() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Query user profile by sovereign_id (wallet address)
        const { data, error: queryError } = await supabase
          .from("user_profiles")
          .select("vitalization_status, vitalized_at")
          .eq("phone_number", address) // Using address as phone_number for now
          .single();

        if (queryError) {
          console.error("[VITALIZATION CHECK ERROR]", queryError);
          setError(queryError.message);
          setIsVitalized(false);
        } else {
          setIsVitalized(data?.vitalization_status === "VITALIZED");
        }
      } catch (err: any) {
        console.error("[VITALIZATION CHECK ERROR]", err);
        setError(err.message);
        setIsVitalized(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkVitalizationStatus();
  }, [address]);

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

  // User is vitalized - show Sovereign Verified badge
  if (isVitalized) {
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


