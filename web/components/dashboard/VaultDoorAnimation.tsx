'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface VaultDoorAnimationProps {
  onComplete: () => void;
}

/**
 * VAULT DOOR OPENING ANIMATION
 * Cinematic transition after successful 4-layer authentication
 * Gold vault doors split open to reveal the Sovereign Dashboard
 */
export function VaultDoorAnimation({ onComplete }: VaultDoorAnimationProps) {
  const [stage, setStage] = useState<'locking' | 'unlocking' | 'opening' | 'complete'>('locking');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Stage 1: Locking mechanism (0.5s)
    setTimeout(() => setStage('unlocking'), 500);

    // Stage 2: Unlocking (1s)
    setTimeout(() => setStage('opening'), 1500);

    // Stage 3: Doors opening (2s)
    const openingInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(openingInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Stage 4: Complete (3.5s total)
    setTimeout(() => {
      setStage('complete');
      setTimeout(onComplete, 500);
    }, 3500);

    return () => clearInterval(openingInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Vault Doors */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Left Door */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#1a1a1e] via-[#2a2a2e] to-[#1a1a1e] border-r-4 border-[#D4AF37] transition-all duration-[2000ms] ease-out"
          style={{
            width: '50%',
            transform: stage === 'opening' || stage === 'complete' ? `translateX(-${progress}%)` : 'translateX(0)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)',
          }}
        >
          {/* Door Details */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] flex items-center justify-center"
              style={{
                boxShadow: stage === 'unlocking' || stage === 'opening' || stage === 'complete'
                  ? '0 0 40px rgba(212, 175, 55, 0.8)'
                  : '0 0 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                <span className="text-4xl">🔒</span>
              </div>
            </div>
          </div>

          {/* Vertical Lines */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-1 bg-[#D4AF37]/20"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>

        {/* Right Door */}
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#1a1a1e] via-[#2a2a2e] to-[#1a1a1e] border-l-4 border-[#D4AF37] transition-all duration-[2000ms] ease-out"
          style={{
            width: '50%',
            transform: stage === 'opening' || stage === 'complete' ? `translateX(${progress}%)` : 'translateX(0)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)',
          }}
        >
          {/* Door Details */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] flex items-center justify-center"
              style={{
                boxShadow: stage === 'unlocking' || stage === 'opening' || stage === 'complete'
                  ? '0 0 40px rgba(212, 175, 55, 0.8)'
                  : '0 0 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                <span className="text-4xl">🔓</span>
              </div>
            </div>
          </div>

          {/* Vertical Lines */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-1 bg-[#D4AF37]/20"
              style={{ right: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>

        {/* Center Status Text */}
        <div className={`absolute z-10 text-center ${jetbrains.className}`}>
          <div className="mb-4">
            <div className="text-6xl mb-4 animate-pulse">
              {stage === 'locking' && '🔐'}
              {stage === 'unlocking' && '🔓'}
              {stage === 'opening' && '✨'}
              {stage === 'complete' && '🌍'}
            </div>
            <h2 className="text-2xl font-bold text-[#D4AF37] uppercase tracking-wider mb-2"
              style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.6)' }}
            >
              {stage === 'locking' && 'SECURING VAULT'}
              {stage === 'unlocking' && 'GENESIS VERIFIED'}
              {stage === 'opening' && 'VAULT OPENING'}
              {stage === 'complete' && 'WELCOME, SOVEREIGN'}
            </h2>
            <p className="text-sm text-[#6b6b70]">
              {stage === 'locking' && 'Initializing biometric lock...'}
              {stage === 'unlocking' && '4-Layer authentication complete'}
              {stage === 'opening' && 'Minting protocol complete — sovereign command...'}
              {stage === 'complete' && 'The Simulation Ends Here.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

