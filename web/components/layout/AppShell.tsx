'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  SlidersHorizontal,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useTripleTapReset } from '@/lib/useTripleTapReset';
import { TerminateSessionListener } from '@/components/dashboard/TerminateSessionListener';
import { getVitalizationStatus, DEVICE_NOT_ANCHORED_MESSAGE } from '@/lib/vitalizationState';
import { getCitizenStatusForPhone } from '@/lib/supabaseTelemetry';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const SettingsNavIcon = SlidersHorizontal;

/** Nav: Dashboard (overview), Treasury (country), Wallet (citizen), Settings. */
const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treasury', label: 'Treasury', icon: Landmark },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: SettingsNavIcon },
];

/** When user is on one of these pages, bottom tab always navigates to href (don't lock). */
const PROTECTED_PATHS = ['/dashboard', '/treasury', '/wallet', '/settings'];
function isOnProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

const VITALIZATION_HREF = '/vitalization';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vitalized, setVitalized] = useState<boolean | null>(null);
  const handleLogoClick = useTripleTapReset();
  /** On protected pages, tabs always go to their route (nav works). */
  const navUnlocked = isOnProtectedPath(pathname) || vitalized === true;

  /** One-tap navigation: immediate client-side transition. */
  const goTo = useCallback((href: string) => {
    const target = navUnlocked ? href : VITALIZATION_HREF;
    if (pathname === target || pathname.startsWith(target + '/')) return;
    router.push(target);
  }, [navUnlocked, pathname, router]);

  useEffect(() => {
    getCitizenStatusForPhone(getIdentityAnchorPhone()).then((status) => setVitalized(status === 'VITALIZED'));
    getVitalizationStatus().then((status) => {
      if (status === 'vitalized') setVitalized(true);
    });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0d0d0f]">
      {/* Desktop / iPad: sidebar (md: = 768px Tailwind breakpoint); mobile uses Sovereign Drawer below */}
      <aside
        className={`
          hidden md:flex flex-col border-r-2 border-[#2a2a2e] md:border-[#D4AF37]/20 bg-[#0a0a0c] shrink-0
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
          {vitalized === false && (
            <Link
              href={VITALIZATION_HREF}
              className="min-h-[48px] flex items-center gap-3 px-3 rounded-lg touch-manipulation bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">Vitalize First</span>}
            </Link>
          )}
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const locked = !navUnlocked;
            return (
              <Link
                key={href}
                href={locked ? VITALIZATION_HREF : href}
                className={`
                  min-h-[48px] flex items-center gap-3 px-3 rounded-lg touch-manipulation
                  transition-colors
                  ${locked ? 'opacity-60 text-[#6b6b70] hover:opacity-100 hover:text-[#D4AF37]' : ''}
                  ${active && !locked ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : !locked ? 'text-[#a0a0a5] hover:bg-[#16161a] hover:text-[#f5f5f5]' : ''}
                `}
                title={locked ? DEVICE_NOT_ANCHORED_MESSAGE : undefined}
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
        <TerminateSessionListener />
        {children}
      </main>

      {/* Mobile: one-tap bottom bar — large touch targets, immediate router.push for smooth transition */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t-2 border-[#D4AF37]/40 bg-[#0a0a0c]/98 backdrop-blur-md safe-area-pb shadow-[0_-4px_24px_rgba(212,175,55,0.08)] select-none"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
        aria-label="Sovereign navigation"
      >
        <div className="flex items-stretch min-h-[64px]">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const locked = !navUnlocked;
            return (
              <button
                key={href}
                type="button"
                onClick={() => goTo(href)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 rounded-none
                  min-h-[64px] min-w-0 touch-manipulation cursor-pointer
                  transition-colors duration-150 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-inset
                  [-webkit-tap-highlight-color:transparent]
                  ${locked ? 'opacity-60 text-[#6b6b70]' : ''}
                  ${active && !locked ? 'text-[#D4AF37] bg-[#D4AF37]/10' : !locked ? 'text-[#6b6b70] hover:text-[#a0a0a5] active:bg-[#16161a] active:text-[#e8c547]' : ''}
                `}
                aria-current={active ? 'page' : undefined}
                aria-label={locked ? DEVICE_NOT_ANCHORED_MESSAGE : label}
                title={locked ? DEVICE_NOT_ANCHORED_MESSAGE : label}
              >
                <Icon className="w-6 h-6 shrink-0 pointer-events-none" aria-hidden />
                <span className="text-[10px] font-medium truncate max-w-[80px] pointer-events-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
