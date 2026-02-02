/**
 * PFF Frontend — Vitalization Page
 * Visual guide to the 4-layer biometric handshake
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import CountdownClock from '../components/CountdownClock';

interface HandshakePhase {
  phase: number;
  name: string;
  icon: string;
  description: string;
  technicalDetails: string;
  duration: string;
  color: string;
}

const handshakePhases: HandshakePhase[] = [
  {
    phase: 1,
    name: 'Face Recognition',
    icon: '👤',
    description: 'Advanced facial biometric capture using device camera with liveness detection.',
    technicalDetails: 'Captures 68+ facial landmarks, performs anti-spoofing checks, generates cryptographic signature without storing raw image data.',
    duration: '~300ms',
    color: '#6b4ce6',
  },
  {
    phase: 2,
    name: 'Fingerprint Scan',
    icon: '👆',
    description: 'Secure fingerprint biometric verification using device secure enclave.',
    technicalDetails: 'Utilizes hardware-backed biometric authentication (Touch ID / Face ID / Android BiometricPrompt), generates encrypted signature.',
    duration: '~400ms',
    color: '#d946ef',
  },
  {
    phase: 3,
    name: 'Heart Rate Verification',
    icon: '❤️',
    description: 'Liveness proof through heart rate detection via camera photoplethysmography.',
    technicalDetails: 'Detects blood flow variations through fingertip camera contact, confirms human presence, generates biometric signature.',
    duration: '~500ms',
    color: '#ef4444',
  },
  {
    phase: 4,
    name: 'Voice Biometric',
    icon: '🎤',
    description: 'Voice pattern recognition for final authentication layer.',
    technicalDetails: 'Analyzes voice frequency patterns, pitch, and cadence. Generates voiceprint signature for composite hash.',
    duration: '~300ms',
    color: '#fbbf24',
  },
];

export const Vitalization: React.FC = () => {
  return (
    <div className="sovereign-portal">
      <div className="page-container">
        <CountdownClock variant="compact" showTitle={false} />
        
        <div className="page-header">
          <h1 className="page-title">🔐 Vitalization Protocol</h1>
          <p className="page-subtitle">
            The 4-Layer Pure Handshake — Proof of Human Presence
          </p>
        </div>

        <div className="vitalization-hero">
          <div className="cohesion-rule">
            <div className="cohesion-icon">⏱️</div>
            <div className="cohesion-content">
              <h2 className="cohesion-title">The 1.5-Second Cohesion Rule</h2>
              <p className="cohesion-description">
                All four phases must complete within <strong>1,500 milliseconds</strong> or the buffer is flushed.
                This ensures real-time human presence and prevents replay attacks.
              </p>
            </div>
          </div>
        </div>

        <div className="handshake-timeline">
          <div className="timeline-bar">
            <div className="timeline-progress"></div>
          </div>

          {handshakePhases.map((phase, index) => (
            <div key={index} className="handshake-phase" style={{ '--phase-color': phase.color } as React.CSSProperties}>
              <div className="phase-number">Phase {phase.phase}</div>
              
              <div className="phase-card">
                <div className="phase-header">
                  <span className="phase-icon">{phase.icon}</span>
                  <h3 className="phase-name">{phase.name}</h3>
                  <span className="phase-duration">{phase.duration}</span>
                </div>

                <p className="phase-description">{phase.description}</p>

                <div className="phase-technical">
                  <h4 className="phase-technical-title">Technical Implementation:</h4>
                  <p className="phase-technical-details">{phase.technicalDetails}</p>
                </div>
              </div>

              {index < handshakePhases.length - 1 && (
                <div className="phase-connector">
                  <div className="connector-arrow">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="vitalization-security">
          <h2 className="security-title">🛡️ Security Features</h2>
          
          <div className="security-grid">
            <div className="security-card">
              <div className="security-icon">🔒</div>
              <h3 className="security-card-title">Zero-Knowledge Principle</h3>
              <p className="security-card-description">
                No raw biometric data is ever transmitted or stored. Only cryptographic signatures are generated and verified.
              </p>
            </div>

            <div className="security-card">
              <div className="security-icon">⚡</div>
              <h3 className="security-card-title">Real-Time Verification</h3>
              <p className="security-card-description">
                The 1.5-second cohesion rule ensures all biometric captures happen in real-time, preventing replay attacks.
              </p>
            </div>

            <div className="security-card">
              <div className="security-icon">🧬</div>
              <h3 className="security-card-title">Composite Hash</h3>
              <p className="security-card-description">
                All four signatures are combined into a single SHA-512 composite hash for verification and VLT logging.
              </p>
            </div>

            <div className="security-card">
              <div className="security-icon">🏛️</div>
              <h3 className="security-card-title">Hardware-Backed</h3>
              <p className="security-card-description">
                Utilizes device secure enclaves (TPM, Secure Enclave, TEE) for tamper-resistant biometric processing.
              </p>
            </div>
          </div>
        </div>

        <div className="vitalization-flow">
          <h2 className="flow-title">📊 Vitalization Flow</h2>
          
          <div className="flow-diagram">
            <div className="flow-step">
              <div className="flow-step-number">1</div>
              <div className="flow-step-content">
                <h4>Initiate Handshake</h4>
                <p>User triggers vitalization from LifeOS dashboard</p>
              </div>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <div className="flow-step-number">2</div>
              <div className="flow-step-content">
                <h4>4-Layer Capture</h4>
                <p>Sequential biometric capture within 1.5s</p>
              </div>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <div className="flow-step-number">3</div>
              <div className="flow-step-content">
                <h4>Generate Proof</h4>
                <p>Create composite hash and Presence Proof</p>
              </div>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <div className="flow-step-number">4</div>
              <div className="flow-step-content">
                <h4>Mint VIDA Cap</h4>
                <p>Issue 1 VIDA Cap with 50/50 split</p>
              </div>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <div className="flow-step-number">5</div>
              <div className="flow-step-content">
                <h4>VLT Logging</h4>
                <p>Record vitalization event on blockchain</p>
              </div>
            </div>
          </div>
        </div>

        <div className="vitalization-footer">
          <p className="vitalization-footer-text">
            🔐 <strong>The Vitalization Protocol</strong> — Your biometric signature is your sovereignty
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vitalization;

