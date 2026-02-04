'use client';

import { useState, useEffect } from 'react';
import { TotalPFFBalance } from './TotalPFFBalance';
import { PFFSovereignAccount } from './PFFSovereignAccount';
import { LegacyAccountsList } from './LegacyAccountsList';
import { NationalScaleTicker } from './NationalScaleTicker';
import { GlobalTradeCard } from './GlobalTradeCard';
import { calculatePFFBalance, createPFFDefaultAccount, type BankAccount, AccountCategory } from '@/lib/pffAggregation';

interface PFFBalanceDashboardProps {
  phoneNumber: string;
  spendableVida: number;
}

/**
 * PFF BALANCE DASHBOARD
 * Complete 220M Auto-Account Logic & Total PFF Aggregation System
 * 
 * UI Hierarchy:
 * - Primary: Total PFF Balance (The Grand Total)
 * - Secondary: PFF Sovereign Account (Sovereign Default)
 * - Tertiary: Linked Legacy Accounts
 * - Footer: National Scale Ticker (220M Nodes)
 */
export function PFFBalanceDashboard({ phoneNumber, spendableVida }: PFFBalanceDashboardProps) {
  const [pffSovereignAccount, setPFFSovereignAccount] = useState<BankAccount | null>(null);
  const [legacyAccounts, setLegacyAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize PFF Sovereign default account
    const defaultAccount = createPFFDefaultAccount(phoneNumber);
    setPFFSovereignAccount(defaultAccount);

    // Load legacy accounts from Supabase
    // TODO: Query Supabase pff_bank_accounts table
    // For now, use mock data
    const mockLegacyAccounts: BankAccount[] = [
      {
        id: crypto.randomUUID(),
        category: AccountCategory.LEGACY_BANK,
        bank_code: 'GTB',
        bank_name: 'Guaranty Trust Bank',
        account_number: '0123456789',
        account_name: 'Isreal Okoro',
        balance_naira: 450000,
        is_primary: false,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        category: AccountCategory.LEGACY_BANK,
        bank_code: 'ZENITH',
        bank_name: 'Zenith Bank',
        account_number: '9876543210',
        account_name: 'Isreal Okoro',
        balance_naira: 280000,
        is_primary: false,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      },
    ];

    setLegacyAccounts(mockLegacyAccounts);
    setIsLoading(false);
  }, [phoneNumber]);

  if (isLoading || !pffSovereignAccount) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#e8c547] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#e8c547] font-semibold">Loading PFF Balance...</p>
        </div>
      </div>
    );
  }

  // Calculate PFF Balance Breakdown
  const pffBreakdown = calculatePFFBalance(
    pffSovereignAccount.balance_naira,
    legacyAccounts,
    spendableVida,
    220_000_000
  );

  const handleAccountsUpdated = () => {
    // Reload accounts from Supabase
    // TODO: Implement refresh logic
    console.log('Accounts updated, refreshing...');
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* PRIMARY: Total PFF Balance */}
        <section>
          <TotalPFFBalance breakdown={pffBreakdown} />
        </section>

        {/* GLOBAL TRADE: DLLR Wallet & Trading HUD */}
        <section>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-[#D4AF37] to-transparent" />
              <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Global Trade</h2>
            </div>
          </div>
          <GlobalTradeCard />
        </section>

        {/* SECONDARY: PFF Sovereign Account (Sovereign Default) */}
        <section>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-[#EE3124] to-transparent" />
              <h2 className="text-sm font-bold text-[#EE3124] uppercase tracking-wider">Secondary Account</h2>
            </div>
          </div>
          <PFFSovereignAccount account={pffSovereignAccount} />
        </section>

        {/* TERTIARY: Linked Legacy Accounts */}
        <section>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-[#6b6b70] to-transparent" />
              <h2 className="text-sm font-bold text-[#6b6b70] uppercase tracking-wider">Tertiary Accounts</h2>
            </div>
          </div>
          <LegacyAccountsList
            accounts={legacyAccounts}
            phoneNumber={phoneNumber}
            onAccountsUpdated={handleAccountsUpdated}
          />
        </section>

        {/* Info Section */}
        <section className="bg-gradient-to-r from-[#16161a] to-[#1a1a1e] rounded-xl p-8 border border-[#2a2a2e]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">🏛️</span>
              <h3 className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">National Reserve</h3>
              <p className="text-xs text-[#6b6b70] leading-relaxed">
                Backed by PFF sovereign liquidity infrastructure
              </p>
            </div>
            <div className="text-center space-y-2">
              <span className="text-4xl">🔐</span>
              <h3 className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">4-Layer Security</h3>
              <p className="text-xs text-[#6b6b70] leading-relaxed">
                Biometric authentication protects every transaction
              </p>
            </div>
            <div className="text-center space-y-2">
              <span className="text-4xl">⚡</span>
              <h3 className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">Instant Transfers</h3>
              <p className="text-xs text-[#6b6b70] leading-relaxed">
                Zero fees between PFF and legacy accounts
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER: National Scale Ticker */}
      <NationalScaleTicker activeSovereignNodes={pffBreakdown.activeSovereignNodes} />
    </div>
  );
}

