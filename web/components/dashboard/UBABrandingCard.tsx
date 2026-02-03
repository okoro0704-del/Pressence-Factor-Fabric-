'use client';

interface UBABrandingCardProps {
  linkedAccounts: string[];
}

/**
 * FUNDZMAN X UBA CO-BRANDING CARD
 * Premium glassmorphism design with UBA Primary Red (#EE3124)
 * Shadow Partner status with consortium handshake messaging
 */
export function UBABrandingCard({ linkedAccounts }: UBABrandingCardProps) {
  if (linkedAccounts.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-br from-[#16161a] via-[#1a1a1e] to-[#16161a] rounded-2xl p-8 border-2 border-[#EE3124] shadow-2xl shadow-[#EE3124]/30 backdrop-blur-xl overflow-hidden">
      {/* Glassmorphism Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EE3124]/5 via-transparent to-[#EE3124]/10 pointer-events-none"></div>
      
      {/* UBA Red Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#EE3124]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#EE3124]/15 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* Header with UBA Logo Placeholder */}
        <div className="flex items-center gap-4 mb-6">
          {/* UBA Logo Placeholder - Glassmorphism Style */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-[#EE3124]/20 border border-[#EE3124]/40 flex items-center justify-center">
              <span className="text-2xl font-black text-[#EE3124]">U</span>
            </div>
          </div>
          
          {/* Brand Title */}
          <div className="flex-1">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#EE3124] via-[#ff4444] to-[#EE3124] uppercase tracking-wider mb-1">
              FUNDZMAN BY UBA
            </h3>
            <p className="text-xs text-[#a0a0a5] font-medium italic">
              Sovereign Liquidity Bridge: Awaiting Final Consortium Handshake.
            </p>
          </div>
          
          {/* Premium Badge */}
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#EE3124]/20 to-[#EE3124]/10 border border-[#EE3124]/30">
            <span className="text-xs font-bold text-[#EE3124] uppercase tracking-wider">Shadow Partner</span>
          </div>
        </div>
        
        {/* Linked Accounts */}
        <div className="space-y-3">
          {linkedAccounts.map((account, index) => (
            <div 
              key={index} 
              className="group relative bg-gradient-to-r from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] rounded-xl p-4 border border-[#EE3124]/30 hover:border-[#EE3124]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#EE3124]/20"
            >
              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EE3124]/5 via-transparent to-[#EE3124]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Bank Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EE3124]/20 to-[#EE3124]/10 border border-[#EE3124]/30 flex items-center justify-center">
                    <span className="text-lg">🏦</span>
                  </div>
                  
                  {/* Account Number */}
                  <div>
                    <span className="text-sm font-mono text-[#f5f5f5] font-semibold">{account}</span>
                    <p className="text-xs text-[#6b6b70] mt-0.5">United Bank for Africa</p>
                  </div>
                </div>
                
                {/* Verification Badge */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">✓ Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Partnership Status Bar */}
        <div className="mt-6 pt-4 border-t border-[#EE3124]/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-[#a0a0a5]">Consortium Status:</span>
              <span className="font-bold text-yellow-400">PENDING HANDSHAKE</span>
            </div>
            <div className="text-[#6b6b70]">
              <span className="font-mono">Est. Q2 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

