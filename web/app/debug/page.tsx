'use client';

import { useEffect, useState } from 'react';
import { pffHealthCheck } from '@core/health-check';
import type { HealthCheckResult } from '@core/health-check';

/**
 * PFF System Health Check — hidden /debug route.
 * Runs hardware, resilience, and National Pulse layer diagnostics.
 * Exposes pffHealthCheck() on window for console use.
 */

export default function DebugPage() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await pffHealthCheck();
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { pffHealthCheck?: () => Promise<HealthCheckResult> }).pffHealthCheck =
        pffHealthCheck;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as unknown as { pffHealthCheck?: unknown }).pffHealthCheck) {
        delete (window as unknown as { pffHealthCheck?: unknown }).pffHealthCheck;
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-[#e0e0e0] p-6 font-mono text-sm">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-bold text-[#c9a227] mb-2">
          PFF System Health Check
        </h1>
        <p className="text-[#6b6b70] mb-6">
          Hidden /debug — Hardware, Resilience, National Pulse.
        </p>
        {loading && !result && (
          <p className="text-[#6b6b70]">Running diagnostics…</p>
        )}
        {error && (
          <p className="text-red-400 mb-4">Error: {error}</p>
        )}
        {result && (
          <>
            <pre
              className="bg-[#16161a] border border-[#2a2a2e] rounded-lg p-4 whitespace-pre-wrap overflow-x-auto"
              style={{ color: result.ok ? '#c9a227' : '#e0e0e0' }}
            >
              {result.report}
            </pre>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={run}
                disabled={loading}
                className="w-fit px-4 py-2 rounded-lg bg-[#c9a227] text-[#0d0d0f] font-semibold hover:bg-[#e8c547] disabled:opacity-50"
              >
                {loading ? 'Running…' : 'Re-run'}
              </button>
              <p className="text-[#6b6b70] text-xs">
                In console: <code className="text-[#c9a227]">pffHealthCheck()</code> →
                returns report.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
