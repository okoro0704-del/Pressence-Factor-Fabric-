'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/biometricAuth';
import { MismatchEventType } from '@/lib/identityMismatchDetection';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface AuditLogEntry {
  id: string;
  phone_number: string;
  event_type: MismatchEventType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  intruder_snapshot: string | null;
  device_hash: string;
  ip_address: string;
  geolocation: { latitude: number; longitude: number; accuracy: number } | null;
  variance_percentage: number;
  similarity_score: number;
  timestamp: string;
  reviewed: boolean;
}

export function SecurityAlertsDashboard({ phoneNumber }: { phoneNumber: string }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('audit_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sovereign_audit_log',
          filter: `phone_number=eq.${phoneNumber}`,
        },
        (payload) => {
          setAuditLogs((prev) => [payload.new as AuditLogEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [phoneNumber]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sovereign_audit_log')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!error && data) {
      setAuditLogs(data as AuditLogEntry[]);
    }
    setLoading(false);
  };

  const markAsReviewed = async (logId: string) => {
    await supabase
      .from('sovereign_audit_log')
      .update({ reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', logId);

    setAuditLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, reviewed: true } : log))
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
        return '#eab308';
      default:
        return '#6b6b70';
    }
  };

  const getEventIcon = (eventType: MismatchEventType) => {
    switch (eventType) {
      case MismatchEventType.TWIN_DETECTED:
        return '👥';
      case MismatchEventType.FAMILY_MEMBER_DETECTED:
        return '👨‍👩‍👧‍👦';
      case MismatchEventType.VOCAL_HARMONIC_MISMATCH:
        return '🎤';
      default:
        return '🚨';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔒</div>
          <p style={{ color: '#D4AF37' }}>Loading security alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className={`text-3xl font-black mb-2 ${jetbrains.className}`}
          style={{ color: '#D4AF37' }}
        >
          🛡️ Security Alerts & Intruder Captures
        </h1>
        <p style={{ color: '#6b6b70' }}>
          Review unauthorized access attempts to your Sovereign Vault
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div
          className="rounded-lg border p-4"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
            Total Attempts
          </p>
          <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
            {auditLogs.length}
          </p>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderColor: 'rgba(212, 175, 55, 0.3)',
          }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
            Unreviewed
          </p>
          <p className="text-2xl font-black" style={{ color: '#D4AF37' }}>
            {auditLogs.filter((log) => !log.reviewed).length}
          </p>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
            Twin Detections
          </p>
          <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
            {auditLogs.filter((log) => log.event_type === MismatchEventType.TWIN_DETECTED).length}
          </p>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
            Family Members
          </p>
          <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
            {auditLogs.filter((log) => log.event_type === MismatchEventType.FAMILY_MEMBER_DETECTED).length}
          </p>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {auditLogs.length === 0 ? (
          <div
            className="rounded-lg border p-8 text-center"
            style={{
              background: 'rgba(212, 175, 55, 0.05)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="text-4xl mb-4">✅</div>
            <p className="font-bold" style={{ color: '#D4AF37' }}>
              No Security Alerts
            </p>
            <p className="text-sm mt-2" style={{ color: '#6b6b70' }}>
              Your Sovereign Vault has not detected any unauthorized access attempts.
            </p>
          </div>
        ) : (
          auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border p-4 cursor-pointer hover:scale-[1.02] transition-transform"
              style={{
                background: log.reviewed
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: log.reviewed
                  ? 'rgba(107, 107, 112, 0.3)'
                  : `rgba(${getSeverityColor(log.severity)}, 0.5)`,
              }}
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getEventIcon(log.event_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold" style={{ color: getSeverityColor(log.severity) }}>
                      {log.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs" style={{ color: '#6b6b70' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm mb-2" style={{ color: '#a0a0a5' }}>
                    {log.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#6b6b70' }}>
                    <span>Variance: {log.variance_percentage.toFixed(2)}%</span>
                    <span>Similarity: {log.similarity_score.toFixed(1)}%</span>
                    <span>IP: {log.ip_address}</span>
                    {!log.reviewed && (
                      <span
                        className="px-2 py-1 rounded font-bold"
                        style={{ background: '#ef4444', color: '#ffffff' }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

