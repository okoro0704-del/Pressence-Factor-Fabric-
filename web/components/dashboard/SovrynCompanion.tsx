'use client';

import { useState, useEffect, useRef } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { VoiceRecognitionEngine, type VoiceCommand } from '@/lib/voiceRecognition';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface SovrynCompanionProps {
  userName: string; // Verified name from 4-layer authentication
  onScrollToBalance?: () => void;
  onOpenSwapModal?: () => void;
  onShowVitalizationStatus?: () => void;
  onTriggerLockdown?: () => void;
  /** When true (e.g. on the dedicated Companion page), start listening automatically. */
  autoStartListening?: boolean;
}

/**
 * SOVRYN COMPANION
 * Authoritative, Loyal, and Insightful AI assistant
 * Voice-activated with Web Speech API
 * Privacy-first design with wake word detection and auto-sleep
 */
export function SovrynCompanion({
  userName,
  onScrollToBalance,
  onOpenSwapModal,
  onShowVitalizationStatus,
  onTriggerLockdown,
  autoStartListening = false,
}: SovrynCompanionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isInterim, setIsInterim] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  
  const voiceEngineRef = useRef<VoiceRecognitionEngine | null>(null);

  // Initialize voice recognition engine (local Sovereign Intelligence; catch failures so Companion still renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let engine: VoiceRecognitionEngine | null = null;
    try {
      engine = new VoiceRecognitionEngine({
        wakeWord: 'sovereign',
        autoSleepMs: 10000,
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
    } catch (e) {
      console.warn('[SovrynCompanion] Voice recognition unavailable:', e);
      setGreeting('Sovereign Intelligence — voice offline.');
      voiceEngineRef.current = null;
      return;
    }

    // Register voice commands
    const commands: VoiceCommand[] = [
      {
        command: 'show my pff balance',
        aliases: ['show balance', 'pff balance', 'my balance', 'check balance'],
        action: () => {
          console.log('📊 Voice command: Show PFF Balance');
          setLastCommand('Scrolling to Grand Total...');
          onScrollToBalance?.();
        },
      },
      {
        command: 'swap vida to dllr',
        aliases: ['swap vida', 'open swap', 'swap modal', 'convert vida'],
        action: () => {
          console.log('💱 Voice command: Swap VIDA to DLLR');
          setLastCommand('Opening Swap Modal...');
          onOpenSwapModal?.();
        },
      },
      {
        command: 'vitalization status',
        aliases: ['check vitalization', 'health check', 'status check', 'my status'],
        action: () => {
          console.log('🔐 Voice command: Vitalization Status');
          setLastCommand('Displaying 4-Layer Health Check...');
          onShowVitalizationStatus?.();
        },
      },
      {
        command: 'lockdown',
        aliases: ['panic', 'emergency lockdown', 'trigger panic', 'emergency'],
        action: () => {
          console.log('🚨 Voice command: Lockdown');
          setLastCommand('Triggering Sovereign Panic Switch...');
          // Require confirmation for critical command
          if (confirm('⚠️ CONFIRM SOVEREIGN LOCKDOWN?\n\nThis will revoke all global sessions and force re-authentication.')) {
            onTriggerLockdown?.();
          } else {
            setLastCommand('Lockdown cancelled.');
          }
        },
      },
    ];

    try {
      engine.registerCommands(commands);
      engine.onTranscript((text, isFinal) => {
        setTranscript(text);
        setIsInterim(!isFinal);
      });
      engine.onCommand((command) => {
        console.log(`✓ Command executed: ${command}`);
      });
      engine.onStateChange((listening) => {
        setIsListening(listening);
        if (!listening) {
          setTranscript('');
          setIsInterim(false);
        }
      });
    } catch (e) {
      console.warn('[SovrynCompanion] Voice setup failed:', e);
      setGreeting('Sovereign Intelligence — voice offline.');
      voiceEngineRef.current = null;
      return;
    }

    voiceEngineRef.current = engine;

    // When on the dedicated Companion page, auto-start listening (activate).
    let startT: ReturnType<typeof setTimeout> | null = null;
    if (autoStartListening) {
      startT = setTimeout(() => {
        try {
          engine.startListening?.();
        } catch {}
      }, 600);
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    setGreeting(`${timeGreeting}, ${userName || 'Architect'}`);

    return () => {
      if (startT) clearTimeout(startT);
      try {
        engine?.destroy?.();
      } catch {}
    };
  }, [userName, onScrollToBalance, onOpenSwapModal, onShowVitalizationStatus, onTriggerLockdown, autoStartListening]);

  const handleMicrophoneClick = () => {
    if (!voiceEngineRef.current) return;

    if (isListening) {
      voiceEngineRef.current.stopListening();
    } else {
      voiceEngineRef.current.startListening();
    }
  };

  return (
    <>
      {/* Companion Icon with Microphone */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {/* Gold Pulsing Aura (when listening) */}
          {isListening && (
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                boxShadow: '0 0 60px rgba(212, 175, 55, 0.8)',
                animation: 'goldPulse 1.5s ease-in-out infinite',
              }}
            />
          )}

          {/* Microphone Button */}
          <button
            onClick={handleMicrophoneClick}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-br from-[#D4AF37] to-[#C9A227] shadow-[0_0_40px_rgba(212,175,55,0.6)]'
                : 'bg-[#16161a] border-2 border-[#D4AF37] hover:bg-[#1a1a1e]'
            }`}
            title={isListening ? 'Stop Listening' : 'Activate Voice Commands'}
          >
            <span className="text-2xl">{isListening ? '🎤' : '🎙️'}</span>
          </button>

          {/* Status Indicator */}
          {isListening && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Greeting Text */}
        <div className="mt-3 text-center">
          <p className={`text-xs font-bold text-[#D4AF37] ${jetbrains.className}`}>
            {greeting}
          </p>
          <p className="text-[10px] text-[#6b6b70] mt-1">
            {isListening ? 'Listening...' : 'Tap to activate'}
          </p>
        </div>
      </div>

      {/* Live Subtitle Display */}
      {isListening && transcript && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
          <div
            className="px-6 py-3 rounded-lg border-2 backdrop-blur-md"
            style={{
              background: 'rgba(5, 5, 5, 0.8)',
              borderColor: isInterim ? 'rgba(107, 107, 112, 0.3)' : 'rgba(212, 175, 55, 0.5)',
            }}
          >
            <p
              className={`font-mono text-sm text-center ${
                isInterim ? 'text-[#6b6b70]' : 'text-[#D4AF37]'
              }`}
            >
              {transcript}
            </p>
          </div>
        </div>
      )}

      {/* Last Command Feedback */}
      {lastCommand && (
        <div className="fixed top-24 right-8 z-50">
          <div
            className="px-4 py-2 rounded-lg border-2 backdrop-blur-md animate-fade-in"
            style={{
              background: 'rgba(5, 5, 5, 0.9)',
              borderColor: 'rgba(212, 175, 55, 0.5)',
            }}
          >
            <p className="text-xs font-bold text-[#D4AF37]">✓ {lastCommand}</p>
          </div>
        </div>
      )}

      {/* Gold Pulse Animation */}
      <style jsx>{`
        @keyframes goldPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
          }
          50% {
            box-shadow: 0 0 60px rgba(212, 175, 55, 0.8);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

