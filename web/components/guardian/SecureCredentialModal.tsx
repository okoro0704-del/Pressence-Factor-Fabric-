/**
 * @file Secure Credential Modal
 * @description Modal for collecting and encrypting service credentials
 * CRITICAL: Implements client-side encryption before transmission
 */

"use client";

import { useState } from "react";
import { GuardianService } from "@/lib/guardian/services";
import { encryptCredentials, CredentialData } from "@/lib/guardian/encryption";
import { X, Lock, Shield, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface SecureCredentialModalProps {
  service: GuardianService;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (encryptedData: any) => Promise<void>;
}

export function SecureCredentialModal({
  service,
  isOpen,
  onClose,
  onSubmit,
}: SecureCredentialModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<"input" | "encrypt" | "success">("input");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleInputChange = (fieldId: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [fieldId]: value }));
    setError(null);
  };
  
  const togglePasswordVisibility = (fieldId: string) => {
    setShowPassword((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };
  
  const handleProceedToEncryption = () => {
    // Validate all required fields
    const missingFields = service.credentialFields
      .filter((field) => field.required && !credentials[field.id])
      .map((field) => field.label);
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }
    
    setStep("encrypt");
  };
  
  const handleEncryptAndSubmit = async () => {
    if (!masterPassword) {
      setError("Master password is required for encryption");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Build credential data
      const credentialData: CredentialData = {
        serviceId: service.id,
        credentialType: "api_key",
        credentials,
      };
      
      // CRITICAL: Encrypt on client-side
      const encrypted = await encryptCredentials(credentialData, masterPassword);
      
      // Submit encrypted data
      await onSubmit(encrypted);
      
      setStep("success");
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to encrypt credentials");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
    setCredentials({});
    setMasterPassword("");
    setShowPassword({});
    setStep("input");
    setError(null);
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Shield className="header-icon" size={24} />
            <h2>Secure {service.name}</h2>
          </div>
          <button onClick={handleClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        {step === "input" && (
          <div className="modal-body">
            <div className="security-notice">
              <Lock size={20} />
              <p>
                Your credentials will be encrypted on your device before transmission.
                PFF never sees your plain-text credentials.
              </p>
            </div>
            
            <div className="form-fields">
              {service.credentialFields.map((field) => (
                <div key={field.id} className="form-group">
                  <label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  <div className="input-wrapper">
                    <input
                      id={field.id}
                      type={
                        field.type === "password" && !showPassword[field.id]
                          ? "password"
                          : "text"
                      }
                      value={credentials[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="credential-input"
                    />
                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.id)}
                        className="toggle-visibility"
                      >
                        {showPassword[field.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                  {field.helpText && (
                    <p className="help-text">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
            
            {error && (
              <div className="error-message">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleProceedToEncryption}
              className="primary-button"
            >
              Proceed to Encryption →
            </button>
          </div>
        )}
        
        {step === "encrypt" && (
          <div className="modal-body">
            <div className="encryption-step">
              <div className="step-icon">
                <Lock size={48} />
              </div>
              <h3>Pre-Encryption Step</h3>
              <p>
                Enter your PFF Master Password to encrypt these credentials.
                This ensures end-to-end encryption.
              </p>
              
              <div className="form-group">
                <label htmlFor="masterPassword">PFF Master Password</label>
                <input
                  id="masterPassword"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="credential-input"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="error-message">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="button-group">
                <button
                  onClick={() => setStep("input")}
                  className="secondary-button"
                  disabled={isProcessing}
                >
                  ← Back
                </button>
                <button
                  onClick={handleEncryptAndSubmit}
                  className="primary-button"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Encrypting..." : "Encrypt & Link"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === "success" && (
          <div className="modal-body">
            <div className="success-step">
              <CheckCircle2 size={64} className="success-icon" />
              <h3>Successfully Linked!</h3>
              <p>
                {service.name} is now protected by Sentinel.
                Your credentials are encrypted and secure.
              </p>
            </div>
          </div>
        )}
        
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }
          
          .modal-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .header-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .header-icon {
            color: #d4af37;
          }
          
          .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0a1628;
            margin: 0;
          }
          
          .close-button {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 0.5rem;
            border-radius: 6px;
            transition: all 0.2s;
          }
          
          .close-button:hover {
            background: #f3f4f6;
            color: #0a1628;
          }
          
          .modal-body {
            padding: 1.5rem;
          }
          
          .security-notice {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 8px;
            margin-bottom: 1.5rem;
          }
          
          .security-notice svg {
            color: #d4af37;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }
          
          .security-notice p {
            font-size: 0.875rem;
            color: #0a1628;
            line-height: 1.5;
            margin: 0;
          }
          
          .form-fields {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 1.5rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .form-group label {
            font-weight: 600;
            color: #0a1628;
            font-size: 0.875rem;
          }
          
          .required {
            color: #ef4444;
            margin-left: 0.25rem;
          }
          
          .input-wrapper {
            position: relative;
          }
          
          .credential-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s;
          }
          
          .credential-input:focus {
            outline: none;
            border-color: #d4af37;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          }
          
          .toggle-visibility {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 0.25rem;
          }
          
          .help-text {
            font-size: 0.75rem;
            color: #6b7280;
            margin: 0;
          }
          
          .error-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            color: #dc2626;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          
          .primary-button,
          .secondary-button {
            width: 100%;
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 48px;
          }
          
          .primary-button {
            background: linear-gradient(135deg, #d4af37, #f0c952);
            color: #0a1628;
          }
          
          .primary-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
          }
          
          .primary-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .secondary-button {
            background: white;
            border: 1px solid #d1d5db;
            color: #0a1628;
          }
          
          .secondary-button:hover:not(:disabled) {
            background: #f9fafb;
          }
          
          .encryption-step,
          .success-step {
            text-align: center;
            padding: 2rem 0;
          }
          
          .step-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: #d4af37;
          }
          
          .encryption-step h3,
          .success-step h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0a1628;
            margin-bottom: 0.75rem;
          }
          
          .encryption-step p,
          .success-step p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }
          
          .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          
          .success-icon {
            color: #10b981;
            margin-bottom: 1rem;
          }
          
          @media (max-width: 640px) {
            .modal-content {
              max-height: 95vh;
            }
            
            .button-group {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

