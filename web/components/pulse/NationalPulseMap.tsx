'use client';

import { useMemo, useState, useCallback } from 'react';
import type { GeoGeography } from 'react-simple-maps';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import {
  metricsForCountry,
  vitalizationDensity,
  formatFraudBlocked,
  DEFAULT_METRICS,
  NATION_CENTROIDS,
} from '@/data/pulse-metrics';
import { PulsePoint } from './PulsePoint';

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function fillForDensity(density: number): string {
  const t = Math.min(1, density * 3);
  const r = Math.round(0x16 + (0xc9 - 0x16) * t);
  const g = Math.round(0x16 + (0xa2 - 0x16) * t);
  const b = Math.round(0x1a + (0x27 - 0x1a) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

interface NationalPulseMapProps {
  pulsingNations: Set<string>;
}

export function NationalPulseMap({ pulsingNations }: NationalPulseMapProps) {
  const [hovered, setHovered] = useState<{
    name: string;
    fraudBlocked: number;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseEnter = useCallback(
    (ev: React.MouseEvent<SVGPathElement>, name: string) => {
      const m = metricsForCountry(name) ?? DEFAULT_METRICS;
      const rect = (ev.target as SVGElement).getBoundingClientRect();
      setHovered({
        name: m.name,
        fraudBlocked: m.fraudBlocked,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const geographyStyle = useMemo(
    () => (geo: { properties?: { name?: string } }) => {
      const m = metricsForCountry(geo.properties?.name) ?? DEFAULT_METRICS;
      const density = vitalizationDensity(m);
      return {
        default: {
          fill: fillForDensity(density),
          stroke: '#2a2a2e',
          strokeWidth: 0.5,
          outline: 'none',
        },
        hover: {
          fill: '#1a1a1e',
          stroke: '#c9a227',
          strokeWidth: 1,
          outline: 'none',
          cursor: 'pointer',
        },
        pressed: { outline: 'none' },
      };
    },
    []
  );

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-[#2a2a2e] bg-obsidian-bg">
      <div className="w-full h-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [20, 20],
          }}
        >
        <ZoomableGroup center={[0, 20]} zoom={1} minZoom={0.8} maxZoom={4}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) => (
              <>
                {(geographies as GeoGeography[]).map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={geographyStyle(geo)}
                    onMouseEnter={(ev) =>
                      handleMouseEnter(ev as React.MouseEvent<SVGPathElement>, geo.properties?.name ?? '')
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
                {Array.from(pulsingNations).map((nation) => {
                  const coords = NATION_CENTROIDS[nation];
                  if (!coords) return null;
                  return (
                    <Marker key={nation} coordinates={coords}>
                      <PulsePoint x={0} y={0} visible />
                    </Marker>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      </div>
      {hovered && (
        <div
          className="fixed pointer-events-none z-[300] px-3 py-2 rounded-lg bg-obsidian-surface border border-gold/30 text-sm text-white shadow-xl"
          style={{
            left: hovered.x,
            top: hovered.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold text-gold-bright">{hovered.name}</p>
          <p className="text-[#6b6b70] mt-0.5">
            Estimated Fraud Blocked: {formatFraudBlocked(hovered.fraudBlocked)}
          </p>
        </div>
      )}
    </div>
  );
}
