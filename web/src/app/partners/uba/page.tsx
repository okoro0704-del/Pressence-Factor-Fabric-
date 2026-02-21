/**
 * @file UBA Partner Integration Page
 * @description Example page showing how UBA integrates with PFF Shared Account Factory
 */

"use client";

import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { UBAAccountCreation } from "@/components/partners/UBAAccountCreation";
import { useAddress } from "@thirdweb-dev/react";
import { useIsWhitelistedPartner } from "@/lib/pff/hooks/useSharedAccountFactory";
import { AlertCircle, Shield } from "lucide-react";

function UBAPageContent() {
  const address = useAddress();
  const { isWhitelisted, isLoading } = useIsWhitelistedPartner(address);
  
  if (!address) {
    return (
      <div className="not-connected">
        <Shield size={48} />
        <h2>Partner Authentication Required</h2>
        <p>Please connect your UBA partner wallet to continue</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Verifying partner credentials...</p>
      </div>
    );
  }
  
  if (!isWhitelisted) {
    return (
      <div className="not-whitelisted">
        <AlertCircle size={48} />
        <h2>Partner Not Whitelisted</h2>
        <p>
          Your wallet address is not whitelisted as a PFF partner.
          <br />
          Please contact PFF Protocol to request partner access.
        </p>
        <div className="contact-info">
          <p><strong>Your Wallet:</strong> {address}</p>
          <p><strong>Email:</strong> partners@pffprotocol.com</p>
        </div>
      </div>
    );
  }
  
  return <UBAAccountCreation />;
}

export default function UBAPartnerPage() {
  return (
    <PFFThirdwebProvider>
      <div className="uba-partner-page">
        <div className="banner">
          <div className="banner-content">
            <h1>UBA × PFF Protocol</h1>
            <p>Partner Integration Portal</p>
          </div>
        </div>
        
        <UBAPageContent />
        
        <style jsx>{`
          .uba-partner-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
          }
          
          .banner {
            background: linear-gradient(135deg, #d4af37, #f0c952);
            padding: 2rem;
            text-align: center;
          }
          
          .banner-content h1 {
            font-size: 2.5rem;
            color: #0a1628;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          .banner-content p {
            font-size: 1.25rem;
            color: #1a2942;
            font-weight: 600;
          }
          
          .not-connected,
          .loading,
          .not-whitelisted {
            max-width: 600px;
            margin: 4rem auto;
            padding: 3rem;
            background: white;
            border-radius: 12px;
            text-align: center;
          }
          
          .not-connected svg,
          .not-whitelisted svg {
            color: #d4af37;
            margin-bottom: 1.5rem;
          }
          
          .not-connected h2,
          .not-whitelisted h2 {
            font-size: 1.75rem;
            color: #0a1628;
            margin-bottom: 1rem;
          }
          
          .not-connected p,
          .not-whitelisted p {
            color: #6b7280;
            line-height: 1.6;
          }
          
          .contact-info {
            margin-top: 2rem;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 8px;
            text-align: left;
          }
          
          .contact-info p {
            margin: 0.5rem 0;
            font-family: monospace;
            font-size: 0.875rem;
          }
          
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e5e7eb;
            border-top-color: #d4af37;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .banner-content h1 {
              font-size: 1.75rem;
            }
            
            .banner-content p {
              font-size: 1rem;
            }
            
            .not-connected,
            .loading,
            .not-whitelisted {
              margin: 2rem 1rem;
              padding: 2rem 1.5rem;
            }
          }
        `}</style>
      </div>
    </PFFThirdwebProvider>
  );
}

