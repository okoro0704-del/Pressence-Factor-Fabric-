'use client';

/**
 * Sovereign Seal — high-contrast National Block emblem watermark.
 * Institutional feel; sits in the background of the Government Treasury Dashboard.
 */
export function SovereignSealWatermark() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute left-1/2 top-1/2 w-[min(90vw,800px)] h-[min(80vh,700px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer shield */}
        <path
          d="M100 12 L180 50 L180 110 Q180 160 100 188 Q20 160 20 110 L20 50 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-[#D4AF37]"
        />
        {/* Inner shield */}
        <path
          d="M100 28 L164 58 L164 102 Q164 142 100 166 Q36 142 36 102 L36 58 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-[#D4AF37]"
        />
        {/* National Block star / emblem */}
        <g className="text-[#D4AF37]" transform="translate(100, 95)">
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i * 72 - 90) * (Math.PI / 180);
            const x1 = 0;
            const y1 = 0;
            const x2 = 0;
            const y2 = -38;
            const x2r = x2 * Math.cos(a) - y2 * Math.sin(a);
            const y2r = x2 * Math.sin(a) + y2 * Math.cos(a);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2r}
                y2={y2r}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
          <circle r="8" fill="currentColor" />
        </g>
        {/* NB monogram */}
        <text
          x="100"
          y="118"
          textAnchor="middle"
          className="fill-[#D4AF37] text-[10px] font-bold tracking-[0.3em]"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          N • B
        </text>
      </svg>
    </div>
  );
}
