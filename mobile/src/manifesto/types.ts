/**
 * PFF — Manifesto Flow
 * CMS-ready slide types for Vitalization Manifesto (Observer → Vitalized Citizen).
 */

export type ManifestoLayout = 'default' | 'lagos' | 'comparison' | 'final';

export interface ManifestoComparison {
  beforeLabel: string;
  beforeBody: string;
  afterLabel: string;
  afterBody: string;
}

export interface ManifestoSlide {
  id: string;
  index: number;
  layout: ManifestoLayout;
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  cta?: string;
  comparison?: ManifestoComparison;
}

export interface ManifestoConfig {
  slides: ManifestoSlide[];
  version?: string;
}
