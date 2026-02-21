/**
 * @file Guardian Shield Screen - Step 2
 * @description Sentinel Cloud-Proxy linking with OAuth
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { linkSentinelProxy } from "@/lib/welcome/api";

interface GuardianShieldScreenProps {
  sovereignId: string;
  onComplete: () => void;
}

export function GuardianShieldScreen({ sovereignId, onComplete }: GuardianShieldScreenProps) {
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleOAuthLink = async (provider: "google" | "apple") => {
    setLinking(true);
    setError(null);
    
    try {
      // Simulate OAuth flow (in production, this would open OAuth popup)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockToken = `${provider}_token_${Date.now()}`;
      
      // Link Sentinel
      const result = await linkSentinelProxy(sovereignId, provider, mockToken);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || "Failed to link Sentinel Cloud-Proxy");
        setLinking(false);
      }
    } catch (err: any) {
      setError(err.message || "OAuth linking failed");
      setLinking(false);
    }
  };
  
  return (
    <div className="guardian-screen">
      <motion.div
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header">
          <motion.div
            className="shield-container"
            animate={{
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.3)",
                "0 0 40px rgba(16, 185, 129, 0.6)",
                "0 0 20px rgba(16, 185, 129, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield size={64} />
          </motion.div>
          <h1>GUARDIAN SHIELD</h1>
          <p className="subtitle">Sentinel Cloud-Proxy Protection</p>
        </div>
        
        <div className="shield-container-main">
          {!linking && !success && (
            <motion.div
              className="oauth-options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="description">
                Link your device to the Sentinel Cloud-Proxy for continuous protection
                against unauthorized access and fraud detection.
              </p>
              
              <div className="oauth-buttons">
                <motion.button
                  onClick={() => handleOAuthLink("google")}
                  className="oauth-button google"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </motion.button>
                
                <motion.button
                  onClick={() => handleOAuthLink("apple")}
                  className="oauth-button apple"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Continue with Apple</span>
                </motion.button>
              </div>
            </motion.div>
          )}
          
          {linking && !success && (
            <motion.div
              className="securing-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="shield-pulse"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Shield size={100} />
              </motion.div>
              <h2>Securing...</h2>
              <p>Establishing Sentinel Cloud-Proxy connection</p>
              <div className="progress-dots">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="dot"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              className="success-view"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle size={100} className="success-icon" />
              <h2>Guardian Shield Active</h2>
              <p>Sentinel Cloud-Proxy Linked</p>
            </motion.div>
          )}
        </div>
        
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>
      
      <style jsx>{`
        .guardian-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 50%, #0f1f35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .guardian-screen::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .content {
          max-width: 700px;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        
        .header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .shield-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #10b981, #d4af37);
          border-radius: 50%;
          color: #0a1628;
          margin-bottom: 1.5rem;
        }
        
        .header h1 {
          font-size: 3rem;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        
        .subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        .shield-container-main {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }
        
        .oauth-options {
          width: 100%;
          text-align: center;
        }
        
        .description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .oauth-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem 2rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }
        
        .oauth-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .oauth-button.google {
          background: rgba(255, 255, 255, 0.95);
          color: #1f1f1f;
          border-color: transparent;
        }
        
        .oauth-button.apple {
          background: #000;
          border-color: #000;
        }
        
        .securing-view,
        .success-view {
          text-align: center;
          color: white;
        }
        
        .shield-pulse {
          color: #10b981;
          margin-bottom: 2rem;
        }
        
        .securing-view h2,
        .success-view h2 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #10b981;
        }
        
        .securing-view p,
        .success-view p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }
        
        .progress-dots {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .dot {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
        }
        
        .success-icon {
          color: #10b981;
          margin-bottom: 1.5rem;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          margin-top: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
          
          .shield-container {
            width: 80px;
            height: 80px;
          }
          
          .shield-container svg {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

