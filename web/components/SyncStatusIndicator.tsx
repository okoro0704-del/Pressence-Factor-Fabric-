'use client';

import { useEffect, useState } from 'react';
import {
  getSyncStatus,
  subscribeSyncStatus,
  triggerSync,
  type SyncStatusLabel,
} from '@/lib/sync-status';

const LABELS: Record<SyncStatusLabel, string> = {
  offline: 'Presence Logged (Offline)',
  syncing: 'Synchronizing…',
  synced: 'Vitalized & Synced',
};

const STYLES: Record<SyncStatusLabel, string> = {
  offline: 'text-red-400',
  syncing: 'text-yellow-400',
  synced: 'text-green-500',
};

export function SyncStatusIndicator() {
  const [label, setLabel] = useState<SyncStatusLabel>('synced');
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = () => {
    getSyncStatus().then((s) => {
      setLabel(s.label);
      setPendingCount(s.pendingCount);
    });
  };

  useEffect(() => {
    refresh();
    if (typeof navigator !== 'undefined' && navigator.onLine) triggerSync();
    const unsub = subscribeSyncStatus(refresh);
    const onOnline = () => {
      triggerSync();
      refresh();
    };
    window.addEventListener('online', onOnline);
    return () => {
      unsub();
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className={`text-sm font-semibold ${STYLES[label]}`}>{LABELS[label]}</p>
      {pendingCount > 0 && label !== 'syncing' && (
        <button
          type="button"
          onClick={() => triggerSync()}
          className="text-xs text-[#6b6b70] hover:text-[#e8c547] underline"
        >
          Sync when online
        </button>
      )}
    </div>
  );
}
