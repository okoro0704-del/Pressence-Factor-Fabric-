'use client';

import { useState, useEffect } from 'react';
import { fetchTreasuryGrowthLast30Days, type TreasuryGrowthDay } from '@/lib/governmentTreasury';

/**
 * Treasury Growth — line graph over the last 30 days.
 */
export function TreasuryGrowthChart() {
  const [days, setDays] = useState<TreasuryGrowthDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreasuryGrowthLast30Days().then((data) => {
      setDays(data);
      setLoading(false);
    });
  }, []);

  if (loading || days.length === 0) {
    return (
      <div className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30 h-[280px] flex items-center justify-center">
        <div className="animate-pulse text-[#6b6b70] text-sm">Loading chart...</div>
      </div>
    );
  }

  const values = days.map((d) => d.cumulativeVida);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const range = maxY - minY || 1;
  const width = 600;
  const height = 200;
  const padding = { top: 12, right: 12, bottom: 24, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pointCoords = days.map((d, i) => {
    const x = padding.left + (i / (days.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.cumulativeVida - minY) / range) * chartHeight;
    return { x, y };
  });
  const points = pointCoords.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonPoints = [
    `${padding.left},${padding.top + chartHeight}`,
    points,
    `${padding.left + chartWidth},${padding.top + chartHeight}`,
  ].join(' ');

  return (
    <div className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
      <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">Treasury Growth (Last 30 Days)</h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[280px] h-[200px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - t)}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight * (1 - t)}
              stroke="#2a2a2e"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          ))}
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Gradient under line */}
          <defs>
            <linearGradient id="treasuryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={polygonPoints}
            fill="url(#treasuryGrad)"
          />
          {/* Y-axis labels */}
          {[minY, (minY + maxY) / 2, maxY].map((v, i) => (
            <text
              key={i}
              x={padding.left - 8}
              y={padding.top + chartHeight - ((v - minY) / range) * chartHeight}
              textAnchor="end"
              className="fill-[#6b6b70] text-[10px] font-mono"
            >
              {v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </text>
          ))}
          {/* X-axis labels (first, mid, last) */}
          {[0, Math.floor(days.length / 2), days.length - 1].map((i) => (
            <text
              key={i}
              x={padding.left + (i / (days.length - 1 || 1)) * chartWidth}
              y={height - 6}
              textAnchor="middle"
              className="fill-[#6b6b70] text-[10px]"
            >
              {days[i]?.date ? new Date(days[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </text>
          ))}
        </svg>
      </div>
      <p className="text-xs text-[#6b6b70] mt-2">Cumulative VIDA to government_treasury_vault</p>
    </div>
  );
}
