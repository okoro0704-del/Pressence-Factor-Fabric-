'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MasterArchitectGuard } from '@/components/admin/MasterArchitectGuard';
import {
  findUserByIdentityAnchorForMaster,
  setUserRole,
  getIdentityAnchorPhone,
  ROLES,
  type Role,
} from '@/lib/roleAuth';
import { maskPhoneForDisplay } from '@/lib/phoneMask';
import { LegacySection } from '@/components/master/LegacySection';

/**
 * Master Architect Dashboard — only place where user roles can be changed.
 * Search by Identity Anchor (phone), dropdown to promote/demote role.
 */
function MasterDashboardContent() {
  const [searchPhone, setSearchPhone] = useState('');
  const [user, setUser] = useState<{ phone_number: string; full_name: string; role: Role } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('CITIZEN');

  const actorPhone = getIdentityAnchorPhone();

  const handleSearch = async () => {
    const phone = searchPhone.trim().replace(/\s/g, '');
    if (!phone) {
      setMessage({ type: 'error', text: 'Enter Identity Anchor (phone number).' });
      setUser(null);
      return;
    }
    setLoading(true);
    setMessage(null);
    const actorPhone = getIdentityAnchorPhone();
    const found = actorPhone ? await findUserByIdentityAnchorForMaster(actorPhone, phone) : null;
    setUser(found);
    setLoading(false);
    if (found) setSelectedRole(found.role);
    else setMessage({ type: 'error', text: 'User not found.' });
  };

  const handleChangeRole = async () => {
    if (!user || !actorPhone) return;
    setSaving(true);
    setMessage(null);
    const result = await setUserRole(actorPhone, user.phone_number, selectedRole);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: 'success', text: `Role updated to ${selectedRole}.` });
      setUser((u) => (u ? { ...u, role: selectedRole } : null));
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to update role.' });
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5] relative">
      <header className="border-b border-[#2a2a2e] bg-[#0d0d0f]/95 backdrop-blur px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#e8c547] bg-clip-text text-transparent tracking-tight">
              Master Architect Dashboard
            </h1>
            <p className="text-xs text-[#6b6b70] mt-0.5">
              Change user roles by Identity Anchor (phone). Only MASTER_ARCHITECT.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/master/command-center"
              className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
            >
              Command Center →
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search by Identity Anchor */}
        <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">Find User by Identity Anchor</h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="+234 801 234 5678"
              className="flex-1 min-w-[200px] px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono text-sm placeholder:text-[#6b6b70] focus:border-[#D4AF37]/50 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider bg-[#D4AF37] text-[#050505] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </section>

        {message && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Legacy — Primary + 2 Secondary Beneficiaries; Family Tree; Proof of Life */}
        {actorPhone && (
          <LegacySection ownerIdentityAnchor={actorPhone} ownerDisplayName="You" />
        )}

        {/* User result + role dropdown */}
        {user && (
          <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">User & Role</h2>
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Identity Anchor</p>
                  <p className="font-mono text-[#e8c547]">{maskPhoneForDisplay(user.phone_number)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Full Name</p>
                  <p className="text-[#f5f5f5]">{user.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Current Role</p>
                  <p className="font-mono text-[#D4AF37]">{user.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2a2a2e]">
                <label className="text-sm text-[#6b6b70]">Promote to:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="px-4 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono text-sm focus:border-[#D4AF37]/50 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleChangeRole}
                  disabled={saving || selectedRole === user.role}
                  className="px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-[#D4AF37] text-[#050505] hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function MasterDashboardPage() {
  return (
    <MasterArchitectGuard>
      <MasterDashboardContent />
    </MasterArchitectGuard>
  );
}
