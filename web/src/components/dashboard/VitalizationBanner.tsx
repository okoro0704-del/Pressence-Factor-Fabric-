'use client';

import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import { ShieldAlert } from 'lucide-react';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

export interface VitalizationBannerProps {
  /** Optional custom message */
  message?: string;
  /** Optional custom CTA text */
  ctaText?: string;
  /** Optional custom route */
  route?: string;
}

/**
 * VITALIZATION BANNER — Zero-State Dashboard Alert.
 * Displayed when user is logged in but not vitalized.
 * Prompts user to visit Vitalization Hub to anchor sovereignty and unlock wallet.
 */
export function VitalizationBanner({
  message = 'Identity Not Vitalized. Visit the Vitalization Hub to anchor your sovereignty.',
  ctaText = 'Go to Vitalization Hub',
  route = '/vitalize',
}: VitalizationBannerProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(route);
  };

  return (
    <div className="w-full mb-6 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-2xl border-2 p-6 md:p-8"
        style={{
          borderColor: 'rgba(212, 175, 55, 0.6)',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)',
        }}
      >
        {/* Animated Background Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(212, 175, 55, 0.1) 10px,
              rgba(212, 175, 55, 0.1) 20px
            )`,
            animation: 'slide 20s linear infinite',
          }}
        />

        <style jsx>{`
          @keyframes slide {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 40px 40px;
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
            animation: fade-in 0.5s ease-out;
          }
        `}</style>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '2px solid rgba(212, 175, 55, 0.6)',
              }}
            >
              <ShieldAlert size={32} style={{ color: GOLD }} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3
              className={`text-xl md:text-2xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`}
              style={{ color: GOLD }}
            >
              Sovereignty Pending
            </h3>
            <p className="text-sm md:text-base text-[#f5f5f5] leading-relaxed">
              {message}
            </p>
          </div>

          {/* CTA Button */}
          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={handleNavigate}
              className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all hover:scale-105 ${jetbrains.className}`}
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
                color: '#050505',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
              }}
            >
              {ctaText}
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="relative z-10 mt-6 pt-6 border-t border-[#D4AF37]/30">
          <div className="flex items-center justify-between text-xs text-[#6b6b70] uppercase tracking-wider">
            <span>Gateway Flow Progress</span>
            <span style={{ color: GOLD }}>Step 2 of 3 Complete</span>
          </div>
          <div className="mt-2 h-2 bg-[#16161a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: '66.66%',
                background: 'linear-gradient(90deg, #D4AF37 0%, #F4D03F 100%)',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

