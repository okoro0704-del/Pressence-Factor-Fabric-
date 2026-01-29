/**
 * Type declaration for react-simple-maps (no @types package).
 */
declare module 'react-simple-maps' {
  import type { ComponentType, ReactNode } from 'react';

  /** Geography item from Geographies children callback (has rsmKey, properties). */
  export interface GeoGeography {
    rsmKey: string;
    properties?: { name?: string; [key: string]: unknown };
    [key: string]: unknown;
  }

  export const ComposableMap: ComponentType<{
    children?: ReactNode;
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    className?: string;
  }>;

  export const ZoomableGroup: ComponentType<{
    children?: ReactNode;
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
  }>;

  export const Geographies: ComponentType<{
    geography: string | object;
    children: (args: { geographies: GeoGeography[] }) => ReactNode;
  }>;

  export const Geography: ComponentType<{
    geography: GeoGeography | object;
    fill?: string;
    stroke?: string;
    style?: object;
    onMouseEnter?: (ev: unknown) => void;
    onMouseLeave?: (ev: unknown) => void;
    onClick?: (ev: unknown) => void;
    children?: ReactNode;
  }>;

  export const Marker: ComponentType<{
    coordinates: [number, number];
    children?: ReactNode;
  }>;
}
