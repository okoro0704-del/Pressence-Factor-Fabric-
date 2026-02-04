'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Globe } from 'lucide-react';
import type { TickerItem } from '@/lib/commandCenterTicker';

interface CommandCenterTickerProps {
  className?: string;
  limit?: number;
  refreshMs?: number;
}

export function CommandCenterTicker({
  className = '',
  limit = 30,
  refreshMs = 15000,
}: CommandCenterTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTicker = async () => {
    try {
      const res = await fetch(`/api/master/ticker?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, refreshMs);
    return () => clearInterval(interval);
  }, [limit, refreshMs]);

  if (loading && items.length === 0) {
    return (
      <div
        className={`flex items-center gap-2 py-2 text-[#6b6b70] text-sm border-t border-[#1a1a1e] ${className}`}
      >
        <div className="w-2 h-2 rounded-full bg-[#D4AF37]/60 animate-pulse" />
        Loading ticker…
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden border-t border-[#1a1a1e] bg-[#050505] py-2 ${className}`}
      aria-label="Live ticker"
    >
      <div
        ref={scrollRef}
        className="flex gap-8 whitespace-nowrap text-sm animate-ticker"
      >
        {items.length === 0 ? (
          <span className="text-[#6b6b70]">No recent Sentinel activations or National Block inflows.</span>
        ) : (
          items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-2 px-2 text-[#a8a8ae]"
            >
              {item.type === 'sentinel_activation' ? (
                <Activity className="w-4 h-4 text-[#D4AF37]/80 shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-[#D4AF37]/80 shrink-0" />
              )}
              <span>{item.message}</span>
              {item.amount && (
                <span className="text-[#D4AF37] font-mono">{item.amount}</span>
              )}
              {item.location && (
                <span className="text-[#6b6b70]">• {item.location}</span>
              )}
            </span>
          ))
        )}
        {/* Duplicate for seamless loop */}
        {items.length > 0 &&
          items.map((item) => (
            <span
              key={`dup-${item.id}`}
              className="inline-flex items-center gap-2 px-2 text-[#a8a8ae]"
            >
              {item.type === 'sentinel_activation' ? (
                <Activity className="w-4 h-4 text-[#D4AF37]/80 shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-[#D4AF37]/80 shrink-0" />
              )}
              <span>{item.message}</span>
              {item.amount && (
                <span className="text-[#D4AF37] font-mono">{item.amount}</span>
              )}
            </span>
          ))}
      </div>
    </div>
  );
}
