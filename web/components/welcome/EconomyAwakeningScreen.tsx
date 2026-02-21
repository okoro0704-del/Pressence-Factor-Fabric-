/**
 * @file Economy Awakening Screen - Step 3
 * @description Gasless VIDA distribution from Treasury
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { distributeVIDA } from "@/lib/welcome/api";

interface EconomyAwakeningScreenProps {
  sovereignId: string;
  onComplete: () => void;
}

export function EconomyAwakeningScreen({ sovereignId, onComplete }: EconomyAwakeningScreenProps) {
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  
  const handleDistribute = async () => {
    setDistributing(true);
    setError(null);
    
    try {
      const result = await distributeVIDA(sovereignId);
      
      if (result.success) {
        setSuccess(true);
        setTxHash(result.transactionHash || null);
        setAmount(result.amount || null);
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        setError(result.error || "Failed to distribute VIDA tokens");
        setDistributing(false);
      }
    } catch (err: any) {
      setError(err.message || "VIDA distribution failed");
      setDistributing(false);
    }
  };
  
  return (
    <div className="economy-screen">
      <motion.div
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header">
          <motion.div
            className="icon-container"
            animate={{
              boxShadow: [
                "0 0 30px rgba(212, 175, 55, 0.4)",
                "0 0 60px rgba(212, 175, 55, 0.7)",
                "0 0 30px rgba(212, 175, 55, 0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={64} />
          </motion.div>
          <h1>ECONOMY AWAKENING</h1>
          <p className="subtitle">Treasury VIDA Distribution</p>
        </div>
        
        <div className="vitalize-container">
          {!distributing && !success && (
            <motion.div
              className="vitalize-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="description">
                Activate your sovereign economy with gasless VIDA tokens from the
                National Treasury. This transaction is free and instant.
              </p>
              
              <motion.button
                onClick={handleDistribute}
                className="vitalize-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(212, 175, 55, 0.3)",
                    "0 0 40px rgba(212, 175, 55, 0.6)",
                    "0 0 20px rgba(212, 175, 55, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap size={32} />
                <span>VITALIZE ECONOMY</span>
              </motion.button>
              
              <div className="features">
                <div className="feature">
                  <CheckCircle size={20} />
                  <span>Gasless Transaction</span>
                </div>
                <div className="feature">
                  <CheckCircle size={20} />
                  <span>Instant Distribution</span>
                </div>
                <div className="feature">
                  <CheckCircle size={20} />
                  <span>Treasury Funded</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {distributing && !success && (
            <motion.div
              className="distributing-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="energy-pulse"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap size={100} />
              </motion.div>
              <h2>Distributing VIDA...</h2>
              <p>Treasury processing gasless transaction</p>
              
              <div className="energy-particles">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    style={{
                      left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <CheckCircle size={120} className="success-icon" />
              </motion.div>
              <h2>Economy Activated</h2>
              <p className="success-message">VIDA tokens distributed successfully</p>
              
              {amount && (
                <div className="amount-display">
                  <span className="amount">{amount} VIDA</span>
                </div>
              )}
              
              {txHash && (
                <div className="tx-hash">
                  <span className="label">Transaction:</span>
                  <span className="hash">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                </div>
              )}
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
        .economy-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 50%, #0f1f35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .economy-screen::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 40%);
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
        
        .icon-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #d4af37, #f0c952);
          border-radius: 50%;
          color: #0a1628;
          margin-bottom: 1.5rem;
        }
        
        .header h1 {
          font-size: 3rem;
          font-weight: 700;
          color: #d4af37;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        }
        
        .subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        .vitalize-container {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          min-height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          position: relative;
        }
        
        .vitalize-view {
          width: 100%;
          text-align: center;
        }
        
        .description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 3rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .vitalize-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.5rem 3rem;
          background: linear-gradient(135deg, #d4af37, #f0c952);
          border: none;
          border-radius: 12px;
          color: #0a1628;
          font-weight: 700;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 2.5rem;
        }
        
        .vitalize-button:hover {
          transform: translateY(-2px);
        }
        
        .features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 300px;
          margin: 0 auto;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
        }
        
        .feature svg {
          color: #10b981;
          flex-shrink: 0;
        }
        
        .distributing-view {
          text-align: center;
          color: white;
          position: relative;
          width: 100%;
        }
        
        .energy-pulse {
          color: #d4af37;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }
        
        .distributing-view h2 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #d4af37;
        }
        
        .distributing-view p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }
        
        .energy-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #d4af37, #10b981);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        
        .success-view {
          text-align: center;
          color: white;
        }
        
        .success-icon {
          color: #10b981;
          margin-bottom: 1.5rem;
        }
        
        .success-view h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #d4af37;
        }
        
        .success-message {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 2rem 0;
        }
        
        .amount-display {
          background: rgba(212, 175, 55, 0.1);
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .amount {
          font-size: 2rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.05em;
        }
        
        .tx-hash {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .tx-hash .label {
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .tx-hash .hash {
          font-family: monospace;
          color: #10b981;
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
          
          .icon-container {
            width: 80px;
            height: 80px;
          }
          
          .icon-container svg {
            width: 40px;
            height: 40px;
          }
          
          .vitalize-button {
            font-size: 1rem;
            padding: 1.25rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}

