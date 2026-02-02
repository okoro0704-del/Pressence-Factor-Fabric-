import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#f5f5f5] flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold text-[#e8c547] mb-2">Page Not Found</h1>
      <p className="text-[#6b6b70] text-center mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or the app may not be built correctly.
        Try one of these:
      </p>
      <nav className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/manifesto"
          className="rounded-xl bg-[#c9a227] px-6 py-3 text-center font-bold text-[#0d0d0f] hover:bg-[#e8c547] transition-colors"
        >
          Manifesto
        </Link>
        <Link
          href="/vitalization"
          className="rounded-xl border border-[#c9a227] px-6 py-3 text-center font-medium text-[#e8c547] hover:bg-[#c9a227]/20 transition-colors"
        >
          Vitalization
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-[#2a2a2e] px-6 py-3 text-center font-medium text-[#6b6b70] hover:text-[#f5f5f5] transition-colors"
        >
          Dashboard
        </Link>
      </nav>
      <p className="mt-8 text-xs text-[#6b6b70] text-center">
        PFF — Born in Lagos. Built for the World.
      </p>
    </div>
  );
}
