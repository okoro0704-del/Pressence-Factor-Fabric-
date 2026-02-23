/**
 * @file Linked Integration Card
 * @description Displays linked service with Sentinel status and Panic Mode toggle
 */

"use client";

import { LinkedIntegration } from "@/lib/guardian/types";
import { Shield, AlertTriangle, Pause, Clock } from "lucide-react";
import { useState } from "react";

interface LinkedIntegrationCardProps {
  integration: LinkedIntegration;
  onTogglePanicMode: (integrationId: string, enabled: boolean) => void;
  onManage: (integrationId: string) => void;
}

export function LinkedIntegrationCard({
  integration,
  onTogglePanicMode,
  onManage,
}: LinkedIntegrationCardProps) {
  const [isPanicMode, setIsPanicMode] = useState(integration.panicMode);
  
  const handlePanicToggle = () => {
    const newState = !isPanicMode;
    setIsPanicMode(newState);
    onTogglePanicMode(integration.id, newState);
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className={`integration-card ${integration.status}`}>
      <div className="card-header">
        <div className="service-info">
          <h3 className="service-name">{integration.serviceName}</h3>
          <p className="masked-account">{integration.maskedAccount}</p>
        </div>
        
        {integration.sentinelActive && (
          <div className="sentinel-badge">
            <div className="pulse-icon">
              <Shield size={20} />
            </div>
            <span>Sentinel Active</span>
          </div>
        )}
      </div>
      
      <div className="card-body">
        <div className="status-row">
          <div className="status-item">
            <span className="label">Status:</span>
            <span className={`status-value ${integration.status}`}>
              {integration.status === "active" && "✓ Active"}
              {integration.status === "error" && "⚠ Error"}
              {integration.status === "paused" && "⏸ Paused"}
            </span>
          </div>
          
          {integration.lastChecked && (
            <div className="status-item">
              <Clock size={14} />
              <span className="last-checked">
                {formatTimestamp(integration.lastChecked)}
              </span>
            </div>
          )}
        </div>
        
        <div className="panic-mode-section">
          <div className="panic-info">
            <AlertTriangle size={18} className={isPanicMode ? "active" : ""} />
            <div>
              <p className="panic-label">Panic Mode</p>
              <p className="panic-description">
                {isPanicMode
                  ? "All transactions blocked"
                  : "Block all outgoing transactions"}
              </p>
            </div>
          </div>
          
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isPanicMode}
              onChange={handlePanicToggle}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      
      <div className="card-footer">
        <button onClick={() => onManage(integration.id)} className="manage-button">
          Manage Integration
        </button>
      </div>
      
      <style jsx>{`
        .integration-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #10b981;
        }
        
        .integration-card.error {
          border-left-color: #ef4444;
        }
        
        .integration-card.paused {
          border-left-color: #f59e0b;
        }
        
        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }
        
        .service-info {
          flex: 1;
        }
        
        .service-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0a1628;
          margin: 0 0 0.25rem 0;
        }
        
        .masked-account {
          font-size: 0.875rem;
          color: #6b7280;
          font-family: monospace;
          margin: 0;
        }
        
        .sentinel-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          color: #10b981;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .pulse-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pulse-icon::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #10b981;
          opacity: 0.3;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        
        .label {
          color: #6b7280;
          font-weight: 500;
        }
        
        .status-value {
          font-weight: 600;
        }
        
        .status-value.active {
          color: #10b981;
        }
        
        .status-value.error {
          color: #ef4444;
        }
        
        .status-value.paused {
          color: #f59e0b;
        }
        
        .last-checked {
          color: #6b7280;
          font-size: 0.75rem;
        }
        
        .panic-mode-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          gap: 1rem;
        }
        
        .panic-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          flex: 1;
        }
        
        .panic-info svg {
          color: #9ca3af;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .panic-info svg.active {
          color: #ef4444;
        }
        
        .panic-label {
          font-weight: 600;
          color: #0a1628;
          font-size: 0.875rem;
          margin: 0 0 0.25rem 0;
        }
        
        .panic-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
          flex-shrink: 0;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          transition: 0.3s;
          border-radius: 28px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #ef4444;
        }
        
        input:checked + .slider:before {
          transform: translateX(24px);
        }
        
        .card-footer {
          margin-top: auto;
        }
        
        .manage-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #0a1628;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
        }
        
        .manage-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        
        @media (max-width: 640px) {
          .integration-card {
            padding: 1rem;
          }
          
          .card-header {
            flex-direction: column;
          }
          
          .sentinel-badge {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

