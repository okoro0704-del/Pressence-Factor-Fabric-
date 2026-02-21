/**
 * @file Sensitivity Slider Component
 * @description Allows users to configure Sentinel behavioral sensitivity
 */

"use client";

import { useState } from "react";
import { SentinelSensitivity, SENSITIVITY_LEVELS } from "@/lib/guardian/types";
import { Shield, AlertTriangle, AlertOctagon } from "lucide-react";

interface SensitivitySliderProps {
  initialSensitivity?: SentinelSensitivity;
  onChange: (sensitivity: SentinelSensitivity) => void;
}

export function SensitivitySlider({
  initialSensitivity = "standard",
  onChange,
}: SensitivitySliderProps) {
  const [sensitivity, setSensitivity] = useState<SentinelSensitivity>(initialSensitivity);
  
  const levels: SentinelSensitivity[] = ["standard", "high_alert", "maximum"];
  
  const handleChange = (newSensitivity: SentinelSensitivity) => {
    setSensitivity(newSensitivity);
    onChange(newSensitivity);
  };
  
  const getIcon = (level: SentinelSensitivity) => {
    switch (level) {
      case "standard":
        return <Shield size={24} />;
      case "high_alert":
        return <AlertTriangle size={24} />;
      case "maximum":
        return <AlertOctagon size={24} />;
    }
  };
  
  return (
    <div className="sensitivity-slider">
      <div className="slider-header">
        <h3>Guardian Sensitivity</h3>
        <p>Define how aggressive the Sentinel should be in detecting threats</p>
      </div>
      
      <div className="slider-options">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => handleChange(level)}
            className={`sensitivity-option ${sensitivity === level ? "active" : ""}`}
            style={{
              borderColor: sensitivity === level ? SENSITIVITY_LEVELS[level].color : "#d1d5db",
            }}
          >
            <div
              className="option-icon"
              style={{
                color: sensitivity === level ? SENSITIVITY_LEVELS[level].color : "#9ca3af",
              }}
            >
              {getIcon(level)}
            </div>
            <div className="option-content">
              <h4 className="option-label">{SENSITIVITY_LEVELS[level].label}</h4>
              <p className="option-description">{SENSITIVITY_LEVELS[level].description}</p>
            </div>
            <div className="radio-indicator">
              <div
                className={`radio-dot ${sensitivity === level ? "active" : ""}`}
                style={{
                  background: sensitivity === level ? SENSITIVITY_LEVELS[level].color : "transparent",
                }}
              />
            </div>
          </button>
        ))}
      </div>
      
      <div className="current-selection">
        <div className="selection-badge" style={{ background: SENSITIVITY_LEVELS[sensitivity].color }}>
          {getIcon(sensitivity)}
          <span>Current: {SENSITIVITY_LEVELS[sensitivity].label}</span>
        </div>
      </div>
      
      <style jsx>{`
        .sensitivity-slider {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .slider-header {
          margin-bottom: 1.5rem;
        }
        
        .slider-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0a1628;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .slider-header p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .slider-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .sensitivity-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        
        .sensitivity-option:hover {
          background: #f9fafb;
          transform: translateX(4px);
        }
        
        .sensitivity-option.active {
          background: rgba(212, 175, 55, 0.05);
        }
        
        .option-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.05);
        }
        
        .option-content {
          flex: 1;
        }
        
        .option-label {
          font-size: 1rem;
          font-weight: 600;
          color: #0a1628;
          margin: 0 0 0.25rem 0;
        }
        
        .option-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        
        .radio-indicator {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .radio-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .radio-dot.active {
          transform: scale(1);
        }
        
        .current-selection {
          display: flex;
          justify-content: center;
        }
        
        .selection-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        @media (max-width: 640px) {
          .sensitivity-slider {
            padding: 1rem;
          }
          
          .sensitivity-option {
            padding: 0.75rem;
          }
          
          .option-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

