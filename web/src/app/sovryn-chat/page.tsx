'use client';

/**
 * PFF Protocol: Sovryn AI Chat Page
 * Standalone page for interacting with SOVRYN AI companion
 * Architect: Isreal Okoro (mrfundzman)
 */

import { useState, useEffect } from 'react';
import { SovrynChat } from '@/components/sovryn/SovrynChat';

export default function SovrynChatPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Try to get wallet address from localStorage
    if (typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem('pff_wallet_address');
      const storedPhone = localStorage.getItem('pff_phone_number');
      
      if (storedWallet) setWalletAddress(storedWallet);
      if (storedPhone) setPhoneNumber(storedPhone);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading SOVRYN AI...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏛️ SOVRYN AI Companion
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your sovereign financial advisor. Ask about VIDA distribution, vitalization, 
            treasury mechanics, or the architecture of economic freedom.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a3e] rounded-xl p-6">
            <div className="text-[#ffd93d] text-2xl mb-2">💎</div>
            <h3 className="text-white font-semibold mb-2">11 VIDA Distribution</h3>
            <p className="text-gray-400 text-sm">
              Learn about the triple-split: 5 to you, 5 to treasury, 1 to foundation
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a3e] rounded-xl p-6">
            <div className="text-[#ffd93d] text-2xl mb-2">🔐</div>
            <h3 className="text-white font-semibold mb-2">Sovereign Pulse</h3>
            <p className="text-gray-400 text-sm">
              Understand the 4-Pillar vitalization process and biometric verification
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a3e] rounded-xl p-6">
            <div className="text-[#ffd93d] text-2xl mb-2">🏦</div>
            <h3 className="text-white font-semibold mb-2">National Treasury</h3>
            <p className="text-gray-400 text-sm">
              Explore collective sovereignty and the locked reserve system
            </p>
          </div>
        </div>

        {/* Chat Component */}
        <div className="h-[600px] md:h-[700px]">
          <SovrynChat 
            walletAddress={walletAddress}
            phoneNumber={phoneNumber}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-full px-6 py-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-400 text-sm">
              Connected to Sentinel Backend
            </span>
          </div>
          
          <div className="mt-4 text-gray-500 text-xs">
            <p>SOVRYN AI • Built on the DOORKEEPER PROTOCOL</p>
            <p className="mt-1">Your data remains sovereign • No surveillance, only sovereignty</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Ask about"]') as HTMLInputElement;
              if (input) {
                input.value = "Explain the 11 VIDA distribution";
                input.focus();
              }
            }}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm hover:border-[#ffd93d] transition-all"
          >
            💎 11 VIDA
          </button>
          
          <button 
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Ask about"]') as HTMLInputElement;
              if (input) {
                input.value = "How does vitalization work?";
                input.focus();
              }
            }}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm hover:border-[#ffd93d] transition-all"
          >
            🔐 Vitalization
          </button>
          
          <button 
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Ask about"]') as HTMLInputElement;
              if (input) {
                input.value = "What is my balance?";
                input.focus();
              }
            }}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm hover:border-[#ffd93d] transition-all"
          >
            💰 Balance
          </button>
          
          <button 
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Ask about"]') as HTMLInputElement;
              if (input) {
                input.value = "Tell me about the National Treasury";
                input.focus();
              }
            }}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm hover:border-[#ffd93d] transition-all"
          >
            🏦 Treasury
          </button>
        </div>
      </div>
    </div>
  );
}

