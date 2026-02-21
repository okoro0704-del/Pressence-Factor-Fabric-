/**
 * @file Genesis Screen - Step 1
 * @description Biometric capture and SBT minting
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle, AlertCircle, Scan } from "lucide-react";
import { captureBiometric, mintSovereignSBT } from "@/lib/welcome/api";
import { BiometricCaptureResult } from "@/lib/welcome/types";

interface GenesisScreenProps {
  sovereignId: string;
  onComplete: () => void;
}

export function GenesisScreen({ sovereignId, onComplete }: GenesisScreenProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err: any) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error("[CAMERA ERROR]", err);
    }
  };
  
  const handleCapture = async () => {
    if (!videoRef.current || !cameraActive) return;
    
    setCapturing(true);
    setError(null);
    
    try {
      // Capture biometric
      const biometricData = await captureBiometric(videoRef.current);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
      
      // Mint SBT
      setMinting(true);
      const result = await mintSovereignSBT(sovereignId, biometricData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || "Failed to mint Sovereign SBT");
        setMinting(false);
      }
    } catch (err: any) {
      setError(err.message || "Biometric capture failed");
      setCapturing(false);
      setMinting(false);
    }
  };
  
  return (
    <div className="genesis-screen">
      <motion.div
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header">
          <motion.div
            className="icon-container"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Scan size={64} />
          </motion.div>
          <h1>GENESIS</h1>
          <p className="subtitle">Sovereign Identity Initialization</p>
        </div>
        
        <div className="camera-container">
          {!cameraActive && !success && (
            <motion.div
              className="camera-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Camera size={80} />
              <p>Biometric Capture Required</p>
              <button onClick={startCamera} className="primary-button">
                <Camera size={20} />
                <span>Initialize Camera</span>
              </button>
            </motion.div>
          )}
          
          {cameraActive && (
            <motion.div
              className="camera-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-feed"
              />
              <div className="scan-overlay">
                <motion.div
                  className="scan-line"
                  animate={{ y: [0, 300, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
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
              <h2>Identity Verified</h2>
              <p>Sovereign SBT Minted</p>
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
        
        {cameraActive && !capturing && !minting && (
          <button onClick={handleCapture} className="capture-button">
            <Scan size={24} />
            <span>Capture Biometric</span>
          </button>
        )}
        
        {(capturing || minting) && (
          <div className="processing">
            <motion.div
              className="spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p>{minting ? "Minting Sovereign SBT..." : "Processing..."}</p>
          </div>
        )}
      </motion.div>
      
      <style jsx>{`
        .genesis-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 50%, #0f1f35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .genesis-screen::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .content {
          max-width: 800px;
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
          background: linear-gradient(135deg, #d4af37, #10b981);
          border-radius: 50%;
          color: #0a1628;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.4);
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
        
        .camera-container {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 2rem;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .camera-placeholder {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .camera-placeholder svg {
          color: #d4af37;
          margin-bottom: 1.5rem;
        }
        
        .camera-placeholder p {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          letter-spacing: 0.05em;
        }
        
        .camera-view {
          width: 100%;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .video-feed {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 12px;
        }
        
        .scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #10b981;
          border-radius: 12px;
          pointer-events: none;
        }
        
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          box-shadow: 0 0 10px #10b981;
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
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #d4af37;
        }
        
        .success-view p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
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
        
        .primary-button,
        .capture-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #d4af37, #10b981);
          border: none;
          border-radius: 8px;
          color: #0a1628;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
        }
        
        .primary-button:hover,
        .capture-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(212, 175, 55, 0.5);
        }
        
        .capture-button {
          width: 100%;
          margin-top: 1.5rem;
        }
        
        .processing {
          text-align: center;
          margin-top: 2rem;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          margin: 0 auto 1rem;
        }
        
        .processing p {
          font-size: 1rem;
          letter-spacing: 0.05em;
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
        }
      `}</style>
    </div>
  );
}

