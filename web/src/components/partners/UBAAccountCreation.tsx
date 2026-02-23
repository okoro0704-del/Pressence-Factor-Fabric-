/**
 * @file UBA Account Creation Component
 * @description Example integration showing how UBA can create shared accounts
 */

"use client";

import { useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { useSharedAccountFactory } from "@/lib/pff/hooks/useSharedAccountFactory";
import { useAccountsBySovereign } from "@/lib/pff/hooks/useSharedAccountFactory";
import { SovereignVerifiedBadge } from "../pff/SovereignVerifiedBadge";
import { CheckCircle2, AlertCircle, Loader2, Building2, Users } from "lucide-react";

export function UBAAccountCreation() {
  const address = useAddress();
  const { createAccount, isCreating, error } = useSharedAccountFactory();
  const { accounts } = useAccountsBySovereign(address);
  
  // Form state
  const [sovereignID, setSovereignID] = useState("");
  const [accountName, setAccountName] = useState("");
  const [additionalAdmins, setAdditionalAdmins] = useState("");
  const [createdAccount, setCreatedAccount] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse additional admins (comma-separated)
    const admins = additionalAdmins
      .split(",")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
    
    // Create account
    const accountAddress = await createAccount({
      sovereignID,
      accountName,
      additionalAdmins: admins,
    });
    
    if (accountAddress) {
      setCreatedAccount(accountAddress);
      // Reset form
      setSovereignID("");
      setAccountName("");
      setAdditionalAdmins("");
    }
  };
  
  return (
    <div className="uba-account-creation">
      <div className="header">
        <Building2 className="header-icon" size={32} />
        <h2>UBA Business Account Creation</h2>
        <p>Create shared business accounts for verified PFF users</p>
      </div>
      
      {createdAccount && (
        <div className="success-message">
          <CheckCircle2 size={24} />
          <div>
            <h3>Account Created Successfully!</h3>
            <p>Account Address: {createdAccount}</p>
            <a
              href={`https://polygonscan.com/address/${createdAccount}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on PolygonScan →
            </a>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="creation-form">
        <div className="form-group">
          <label htmlFor="sovereignID">
            Sovereign ID (Customer's PFF Wallet) *
          </label>
          <input
            id="sovereignID"
            type="text"
            value={sovereignID}
            onChange={(e) => setSovereignID(e.target.value)}
            placeholder="0x..."
            required
            disabled={isCreating}
          />
          <p className="help-text">
            The customer's master PFF wallet address (must be KYC verified)
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="accountName">Business Account Name *</label>
          <input
            id="accountName"
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., ABC Corp Business Account"
            required
            disabled={isCreating}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="additionalAdmins">
            Additional Admins (Optional)
          </label>
          <input
            id="additionalAdmins"
            type="text"
            value={additionalAdmins}
            onChange={(e) => setAdditionalAdmins(e.target.value)}
            placeholder="0x..., 0x..., 0x..."
            disabled={isCreating}
          />
          <p className="help-text">
            Comma-separated wallet addresses for additional account admins
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isCreating || !address}
          className="submit-button"
        >
          {isCreating ? (
            <>
              <Loader2 className="spinner" size={20} />
              Creating Account...
            </>
          ) : (
            <>
              <Users size={20} />
              Create Business Account
            </>
          )}
        </button>
      </form>
      
      {accounts.length > 0 && (
        <div className="accounts-list">
          <h3>Your Created Accounts ({accounts.length})</h3>
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account} className="account-card">
                <p className="account-address">{account}</p>
                <a
                  href={`https://polygonscan.com/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Details →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .uba-account-creation {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .header-icon {
          color: #d4af37;
          margin-bottom: 1rem;
        }
        
        h2 {
          font-size: 2rem;
          color: #0a1628;
          margin-bottom: 0.5rem;
        }
        
        .success-message,
        .error-message {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        
        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #16a34a;
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }
        
        .creation-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #0a1628;
        }
        
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        input:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .help-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        .submit-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #d4af37, #f0c952);
          color: #0a1628;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .accounts-list {
          margin-top: 2rem;
        }
        
        .accounts-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .account-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .account-address {
          font-family: monospace;
          font-size: 0.875rem;
          color: #0a1628;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

