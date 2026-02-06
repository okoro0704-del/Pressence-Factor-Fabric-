'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ANDROID_APK_URL } from '@/lib/appStoreUrls';
import { Download, Globe } from 'lucide-react';

export default function GetAppPage() {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) setPlatform('android');
    else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else setPlatform('desktop');
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 safe-area-top safe-area-pb">
      <div className="max-w-md w-full sovereign-card text-center">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: '#f5f5f5' }}>
          Get PFF PROTOCOL
        </h1>
        <p className="text-sm text-[#a0a0a5] mb-8">
          The Protocol requires a mobile anchor. Install the native app to secure your 1 VIDA.
        </p>

        {platform === 'android' && (
          <div className="flex flex-col gap-3">
            <a
              href={ANDROID_APK_URL}
              download="pff-protocol.apk"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98] duration-300"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
                color: '#0d0d0f',
                boxShadow: '0 0 24px rgba(212, 175, 55, 0.4)',
              }}
            >
              <Download className="w-5 h-5" />
              Download PFF PROTOCOL
            </a>
            <p className="text-xs text-[#6b6b70]">
              Install the APK when the download finishes. You may need to allow installs from this browser.
            </p>
          </div>
        )}

        {platform === 'ios' && (
          <div className="flex flex-col gap-4 text-left">
            <p className="text-sm text-[#a0a0a5]">
              PFF PROTOCOL is not on the App Store yet. Use the web app in Safari (Add to Home Screen for a full-screen experience) or check back later for the native iOS app.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold uppercase tracking-wider border-2 transition-all hover:opacity-95"
              style={{
                borderColor: 'rgba(212, 175, 55, 0.6)',
                color: '#D4AF37',
              }}
            >
              <Globe className="w-5 h-5" />
              Open web app
            </Link>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#a0a0a5]">
              Open this page on your Android phone to download the app, or download the APK here and transfer it to your device.
            </p>
            <a
              href={ANDROID_APK_URL}
              download="pff-protocol.apk"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98] duration-300"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
                color: '#0d0d0f',
                boxShadow: '0 0 24px rgba(212, 175, 55, 0.4)',
              }}
            >
              <Download className="w-5 h-5" />
              Download for Android (APK)
            </a>
            <div className="rounded-lg border border-[#2a2a2e] p-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1">iPhone / iPad</p>
              <p className="text-xs text-[#a0a0a5]">
                Native app coming later. Use the web app (Add to Home Screen) for now.
              </p>
            </div>
          </div>
        )}

        {platform === null && (
          <div className="animate-pulse text-sm text-[#6b6b70]">Detecting device…</div>
        )}

        <Link
          href="/"
          className="inline-block mt-8 text-sm font-semibold uppercase tracking-wider"
          style={{ color: '#D4AF37' }}
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
