/**
 * @file Service Card Component
 * @description Card displaying a financial service with "Secure This App" button
 */

"use client";

import { GuardianService } from "@/lib/guardian/services";
import { Shield, Lock, CheckCircle } from "lucide-react";

interface ServiceCardProps {
  service: GuardianService;
  isLinked?: boolean;
  onSecure: (serviceId: string) => void;
}

export function ServiceCard({ service, isLinked, onSecure }: ServiceCardProps) {
  return (
    <div className="service-card">
      <div className="card-header">
        <div className="service-logo" style={{ background: service.color }}>
          <span className="logo-emoji">{service.logo}</span>
        </div>
        {isLinked && (
          <div className="linked-badge">
            <CheckCircle size={16} />
            <span>Linked</span>
          </div>
        )}
      </div>
      
      <div className="card-body">
        <h3 className="service-name">{service.name}</h3>
        <p className="service-category">{service.category.toUpperCase()}</p>
        <p className="service-description">{service.description}</p>
      </div>
      
      <div className="card-footer">
        <button
          onClick={() => onSecure(service.id)}
          className={`secure-button ${isLinked ? "linked" : ""}`}
          disabled={isLinked}
        >
          {isLinked ? (
            <>
              <Lock size={18} />
              <span>Sentinel Active</span>
            </>
          ) : (
            <>
              <Shield size={18} />
              <span>Secure This App</span>
            </>
          )}
        </button>
      </div>
      
      <style jsx>{`
        .service-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .service-logo {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .logo-emoji {
          font-size: 2rem;
        }
        
        .linked-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 6px;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .card-body {
          flex: 1;
          margin-bottom: 1rem;
        }
        
        .service-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0a1628;
          margin-bottom: 0.25rem;
        }
        
        .service-category {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        
        .service-description {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.5;
        }
        
        .card-footer {
          margin-top: auto;
        }
        
        .secure-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          min-height: 44px;
        }
        
        .secure-button:not(.linked) {
          background: linear-gradient(135deg, #d4af37, #f0c952);
          color: #0a1628;
        }
        
        .secure-button:not(.linked):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        
        .secure-button.linked {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          cursor: default;
        }
        
        .secure-button:disabled {
          opacity: 0.8;
        }
        
        @media (max-width: 640px) {
          .service-card {
            padding: 1rem;
          }
          
          .service-logo {
            width: 56px;
            height: 56px;
          }
          
          .logo-emoji {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

