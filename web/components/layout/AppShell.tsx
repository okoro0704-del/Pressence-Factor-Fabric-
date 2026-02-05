'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Landmark, Vote, Shield, Settings2, ChevronLeft, Menu } from 'lucide-react';
import { useTripleTapReset } from '@/lib/useTripleTapReset';

/** Bottom tab bar and sidebar: Dashboard, Treasury, Elections, Master, Command, Settings. */
const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treasury', label: 'Treasury', icon: Landmark },
  { href: '/government/elections', label: 'Elections', icon: Vote },
  { href: '/master/dashboard', label: 'Master', icon: Shield },
  { href: '/master/command-center', label: 'Command', icon: Settings2 },
  { href: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogoClick = useTripleTapReset();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0d0d0f]">
      {/* Desktop / iPad: persistent or collapsible sidebar */}
      <aside
        className={`
          hidden md:flex flex-col border-r border-[#2a2a2e] bg-[#0a0a0c] shrink-0
          ${sidebarOpen ? 'w-56' : 'w-16'}
          transition-[width] duration-200 ease-out
        `}
      >
        <div className="p-3 flex items-center justify-between min-h-[48px] border-b border-[#2a2a2e]">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2 min-w-0 shrink cursor-pointer bg-transparent border-0 p-0 text-left focus:outline-none focus:ring-0"
            aria-label="PFF Sovereign Protocol"
          >
            {sidebarOpen ? (
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                <Image src="/icons/icon-96.png" alt="PFF" width={24} height={24} className="shrink-0" priority />
                PFF
              </span>
            ) : (
              <Image src="/icons/icon-96.png" alt="PFF" width={32} height={32} className="shrink-0 mx-auto" priority />
            )}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg text-[#6b6b70] hover:text-[#D4AF37] hover:bg-[#16161a] touch-manipulation"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="p-2 space-y-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`
                  min-h-[48px] flex items-center gap-3 px-3 rounded-lg touch-manipulation
                  transition-colors
                  ${active ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#a0a0a5] hover:bg-[#16161a] hover:text-[#f5f5f5]'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content — single column on mobile, flex-1 on md+ */}
      <main className="flex-1 flex flex-col min-h-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile: bottom-docked navigation bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a2a2e] bg-[#0a0a0c]/95 backdrop-blur safe-area-pb"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex items-center justify-around min-h-[56px] px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`
                  min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg touch-manipulation px-2 py-2
                  ${active ? 'text-[#D4AF37]' : 'text-[#6b6b70]'}
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-6 h-6 shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-[64px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
