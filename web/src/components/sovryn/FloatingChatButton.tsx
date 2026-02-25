'use client';

/**
 * PFF Protocol: Floating SOVRYN AI Chat Button
 * Global chat access from any page
 * Architect: Isreal Okoro (mrfundzman)
 */

import { useState, useEffect } from 'react';
import { SovrynChat } from './SovrynChat';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Try to get user context from localStorage
    if (typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem('pff_wallet_address');
      const storedPhone = localStorage.getItem('pff_phone_number');
      
      if (storedWallet) setWalletAddress(storedWallet);
      if (storedPhone) setPhoneNumber(storedPhone);
    }
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#ffd93d] to-[#f9ca24] text-black font-bold px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 flex items-center gap-2 group"
        aria-label="Open SOVRYN AI Chat"
      >
        <span className="text-2xl">🏛️</span>
        <span className="hidden md:inline">Ask SOVRYN AI</span>
        
        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-[#ffd93d] opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={(e) => {
            // Close when clicking backdrop
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-5xl h-[85vh] relative animate-slideUp">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#ffd93d] text-xl font-bold transition-colors flex items-center gap-2"
              aria-label="Close chat"
            >
              <span>✕</span>
              <span className="text-sm">Close</span>
            </button>
            
            {/* Chat Component */}
            <SovrynChat 
              walletAddress={walletAddress}
              phoneNumber={phoneNumber}
            />
          </div>
        </div>
      )}

      {/* Add animations to global styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

