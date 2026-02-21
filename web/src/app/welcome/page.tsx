/**
 * @file Sovereign Welcome Flow
 * @description High-fidelity onboarding experience with biometric capture, Sentinel linking, and VIDA distribution
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAddress } from "@thirdweb-dev/react";
import { GenesisScreen } from "@/components/welcome/GenesisScreen";
import { GuardianShieldScreen } from "@/components/welcome/GuardianShieldScreen";
import { EconomyAwakeningScreen } from "@/components/welcome/EconomyAwakeningScreen";
import { WelcomeStep, WelcomeFlowState } from "@/lib/welcome/types";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const address = useAddress();
  const router = useRouter();
  
  const [flowState, setFlowState] = useState<WelcomeFlowState>({
    currentStep: "genesis",
    completedSteps: [],
    biometricCaptured: false,
    sbtMinted: false,
    sentinelLinked: false,
    vidaDistributed: false,
    sovereignId: undefined,
  });
  
  useEffect(() => {
    if (address) {
      setFlowState((prev) => ({ ...prev, sovereignId: address }));
    }
  }, [address]);
  
  const handleStepComplete = (step: WelcomeStep) => {
    setFlowState((prev) => {
      const completedSteps = [...prev.completedSteps, step];
      
      let nextStep: WelcomeStep = step;
      let updates: Partial<WelcomeFlowState> = {};
      
      if (step === "genesis") {
        nextStep = "guardian";
        updates = { biometricCaptured: true, sbtMinted: true };
      } else if (step === "guardian") {
        nextStep = "vitalize";
        updates = { sentinelLinked: true };
      } else if (step === "vitalize") {
        updates = { vidaDistributed: true };
        // Flow complete - redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
      
      return {
        ...prev,
        currentStep: nextStep,
        completedSteps,
        ...updates,
      };
    });
  };
  
  if (!address) {
    return (
      <div className="loading-screen">
        <motion.div
          className="loading-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="spinner" />
          <p>Initializing Sovereign Wallet...</p>
        </motion.div>
        
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a1628 0%, #1a2942 50%, #0f1f35 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loading-content {
            text-align: center;
            color: white;
          }
          
          .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(212, 175, 55, 0.2);
            border-top-color: #d4af37;
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .loading-content p {
            font-size: 1.125rem;
            color: rgba(255, 255, 255, 0.8);
            letter-spacing: 0.05em;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="welcome-page">
      {/* Progress Indicator */}
      <div className="progress-bar">
        <div className="progress-steps">
          {["genesis", "guardian", "vitalize"].map((step, index) => (
            <div
              key={step}
              className={`progress-step ${
                flowState.completedSteps.includes(step as WelcomeStep)
                  ? "completed"
                  : flowState.currentStep === step
                  ? "active"
                  : "pending"
              }`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">
                {step === "genesis" && "Identity"}
                {step === "guardian" && "Protection"}
                {step === "vitalize" && "Economy"}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        {flowState.currentStep === "genesis" && (
          <motion.div
            key="genesis"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <GenesisScreen
              sovereignId={flowState.sovereignId!}
              onComplete={() => handleStepComplete("genesis")}
            />
          </motion.div>
        )}
        
        {flowState.currentStep === "guardian" && (
          <motion.div
            key="guardian"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <GuardianShieldScreen
              sovereignId={flowState.sovereignId!}
              onComplete={() => handleStepComplete("guardian")}
            />
          </motion.div>
        )}
        
        {flowState.currentStep === "vitalize" && (
          <motion.div
            key="vitalize"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <EconomyAwakeningScreen
              sovereignId={flowState.sovereignId!}
              onComplete={() => handleStepComplete("vitalize")}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        .welcome-page {
          position: relative;
          min-height: 100vh;
        }
        
        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(10, 22, 40, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          padding: 1.5rem 2rem;
          z-index: 100;
        }
        
        .progress-steps {
          display: flex;
          justify-content: center;
          gap: 3rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s;
        }
        
        .progress-step.pending .step-number {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .progress-step.active .step-number {
          background: linear-gradient(135deg, #d4af37, #10b981);
          color: #0a1628;
          border: 2px solid #d4af37;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        }
        
        .progress-step.completed .step-number {
          background: #10b981;
          color: white;
          border: 2px solid #10b981;
        }
        
        .step-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.3s;
        }
        
        .progress-step.pending .step-label {
          color: rgba(255, 255, 255, 0.4);
        }
        
        .progress-step.active .step-label {
          color: #d4af37;
          font-weight: 600;
        }
        
        .progress-step.completed .step-label {
          color: #10b981;
        }
        
        @media (max-width: 768px) {
          .progress-steps {
            gap: 1.5rem;
          }
          
          .step-number {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }
          
          .step-label {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

