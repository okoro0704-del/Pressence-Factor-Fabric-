'use client';

import { useState, useEffect } from 'react';
import {
  getMerchantSales,
  totalVidaAndNaira,
  groupSalesByDay,
  VIDA_TO_NAIRA,
  type MerchantSale,
} from '@/lib/merchantSales';
import { notifyMerchantPaymentReceived, requestNotificationPermission } from '@/lib/merchantNotifications';

interface MerchantSalesTabProps {
  walletAddress: string | null;
}

export function MerchantSalesTab({ walletAddress }: MerchantSalesTabProps) {
  const [sales, setSales] = useState<MerchantSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setSales([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getMerchantSales(walletAddress);
      if (!cancelled) {
        setSales(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const { totalVida, totalNaira } = totalVidaAndNaira(sales);
  const byDay = groupSalesByDay(sales);
  const sortedDays = Array.from(byDay.keys()).sort().reverse();

  const handleTestPayment = () => {
    const amount = 0.01;
    notifyMerchantPaymentReceived(amount);
    setSales((prev) => [
      {
        id: `test-${Date.now()}`,
        amountVida: amount,
        amountNaira: amount * VIDA_TO_NAIRA,
        createdAt: new Date().toISOString(),
        label: 'Test',
      },
      ...prev,
    ]);
  };

  if (!walletAddress) {
    return (
      <div className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-6">
        <h3 className="text-sm font-semibold text-[#c9a227] uppercase tracking-wider mb-2">Sales</h3>
        <p className="text-sm text-[#6b6b70]">Enable Merchant Mode and set wallet to see sales.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#c9a227] uppercase tracking-wider">Sales</h3>
        <button
          type="button"
          onClick={handleTestPayment}
          className="text-xs px-2 py-1 rounded border border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
        >
          Test notification
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-[#6b6b70]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
              <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Total VIDA</p>
              <p className="text-xl font-bold text-[#e8c547]">{totalVida.toFixed(4)} VIDA</p>
            </div>
            <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
              <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-1">VIDA → Naira</p>
              <p className="text-xl font-bold text-emerald-400">
                ₦{totalNaira.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-2">Daily intake</p>
            <ul className="space-y-2">
              {sortedDays.length === 0 ? (
                <li className="text-sm text-[#6b6b70]">No sales yet.</li>
              ) : (
                sortedDays.slice(0, 14).map((day) => {
                  const daySales = byDay.get(day)!;
                  const { totalVida: dv, totalNaira: dn } = totalVidaAndNaira(daySales);
                  return (
                    <li
                      key={day}
                      className="flex items-center justify-between py-2 border-b border-[#2a2a2e] text-sm"
                    >
                      <span className="text-[#a0a0a5]">{day}</span>
                      <span className="text-[#e8c547]">{dv.toFixed(4)} VIDA</span>
                      <span className="text-emerald-400">₦{dn.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
