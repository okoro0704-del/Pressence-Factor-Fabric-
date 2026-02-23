'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProvePresenceButton } from './ProvePresenceButton';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import staticManifesto from '@/data/manifesto.json';

interface Slide {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  body?: string;
  cta?: string;
}

interface ManifestoData {
  version: string;
  tagline: string;
  slides: Slide[];
}

export function ManifestoContent() {
  const [data, setData] = useState<ManifestoData | null>(staticManifesto as ManifestoData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/manifesto')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((json) => setData(json))
      .catch(() => {
        // Static export has no API; keep static data (already set from import)
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-[#6b6b70]" data-testid="manifesto-loading">
        Loading…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-[#6b6b70]">
        {error ?? 'Unable to load manifesto.'} Try again when you’re back online.
      </div>
    );
  }

  const { tagline, slides } = data;

  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto" data-testid="manifesto-page">
      <header className="text-center mb-16">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#e8c547]">
          PFF — Presence Factor Fabric
        </h1>
        <p className="mt-2 text-[#6b6b70] font-semibold tracking-wide uppercase text-sm">
          {tagline}
        </p>
      </header>

      <section className="space-y-20" aria-label="Vitalization Manifesto">
        {slides.map((slide) => (
          <article
            key={slide.id}
            id={slide.id}
            className="scroll-mt-24"
            itemScope
            itemType="https://schema.org/Article"
          >
            <h2
              className="text-xl font-extrabold text-white mb-1"
              itemProp="headline"
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p
                className="text-sm font-semibold text-[#c9a227] uppercase tracking-wider mb-4"
                itemProp="alternativeHeadline"
              >
                {slide.subtitle}
              </p>
            )}
            {slide.body && (
              <p
                className="text-[#6b6b70] leading-relaxed"
                itemProp="articleBody"
              >
                {slide.body}
              </p>
            )}
            {slide.cta && (
              <p className="mt-4 text-[#e8c547] font-bold">{slide.cta}</p>
            )}
          </article>
        ))}
      </section>

      <footer className="mt-24 pt-8 border-t border-[#2a2a2e] text-center text-sm text-[#6b6b70]">
        <p className="mb-4">PFF — Presence Factor Fabric. Born in Lagos. Built for the World.</p>
        <p className="mb-2">
          <Link href="/registration" className="text-[#c9a227] hover:text-[#e8c547] underline">
            Registration Hub
          </Link>
          {' · '}
          <Link href="/pulse" className="text-[#c9a227] hover:text-[#e8c547] underline">
            National Pulse
          </Link>
          {' · '}
          <Link href="/dashboard" className="text-[#c9a227] hover:text-[#e8c547] underline">
            Dashboard (DLLR)
          </Link>
          {' · '}
          <span className="text-[#4a4a4e]">Prove Presence below</span>
        </p>
        <ProvePresenceButton />
        <div className="mt-4">
          <SyncStatusIndicator />
        </div>
      </footer>
    </main>
  );
}
