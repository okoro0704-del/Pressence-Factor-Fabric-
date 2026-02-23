'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/biometricAuth';

export interface BreachAlert {
  id: string;
  breach_id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  device_hash: string;
  timestamp: string;
  acknowledged: boolean;
  variance_percentage?: number;
  layer?: string;
}

export function BreachMonitoringDashboard() {
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNACKNOWLEDGED'>('UNACKNOWLEDGED');

  useEffect(() => {
    fetchBreachAlerts();
    
    // Subscribe to real-time breach alerts
    const channel = supabase
      .channel('breach_alerts_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'breach_alerts'
      }, (payload: { new?: Record<string, unknown> } | undefined) => {
        if (!payload?.new || typeof payload.new !== 'object') return;
        const next = payload.new as Record<string, unknown>;
        setBreachAlerts(prev => [{ ...next } as unknown as BreachAlert, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBreachAlerts = async () => {
    try {
      setLoading(true);
      const client = supabase as any;
      let query = client.from('breach_alerts').select('*').order('timestamp', { ascending: false }).limit(50);
      if (filter === 'UNACKNOWLEDGED') query = query.eq('acknowledged', false);
      const { data, error } = await query;

      if (error) throw error;

      setBreachAlerts(data || []);
    } catch (error) {
      console.error('Error fetching breach alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('breach_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: 'Architect'
        })
        .eq('id', alertId);

      if (error) throw error;

      // Update local state
      setBreachAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b6b70';
    }
  };

  const getLayerIcon = (layer?: string) => {
    switch (layer) {
      case 'BIOMETRIC_SIGNATURE': return '👤';
      case 'VOICE_PRINT': return '🎤';
      case 'HARDWARE_TPM': return '🔐';
      case 'GENESIS_HANDSHAKE': return '🤝';
      default: return '⚠️';
    }
  };

  useEffect(() => {
    fetchBreachAlerts();
  }, [filter]);

  return (
    <div 
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🛡️</div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
              Breach Monitoring
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6b6b70' }}>
              Real-time security breach detection and alerts
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('UNACKNOWLEDGED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'UNACKNOWLEDGED' ? 'scale-105' : 'opacity-50'
            }`}
            style={{
              background: filter === 'UNACKNOWLEDGED' 
                ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' 
                : '#2a2a2e',
              color: filter === 'UNACKNOWLEDGED' ? '#0d0d0f' : '#6b6b70'
            }}
          >
            Unacknowledged
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'ALL' ? 'scale-105' : 'opacity-50'
            }`}
            style={{
              background: filter === 'ALL' 
                ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' 
                : '#2a2a2e',
              color: filter === 'ALL' ? '#0d0d0f' : '#6b6b70'
            }}
          >
            All Alerts
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-sm" style={{ color: '#6b6b70' }}>Loading breach alerts...</p>
        </div>
      ) : breachAlerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-bold mb-2" style={{ color: '#22c55e' }}>
            No Breach Attempts Detected
          </p>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            All authentication attempts are within acceptable variance
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {breachAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className="rounded-lg border p-4"
              style={{
                background: alert.acknowledged 
                  ? 'rgba(0, 0, 0, 0.3)' 
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: alert.acknowledged 
                  ? '#2a2a2e' 
                  : getSeverityColor(alert.severity),
                opacity: alert.acknowledged ? 0.6 : 1
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{getLayerIcon(alert.breach_attempts?.layer)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{
                          background: getSeverityColor(alert.severity),
                          color: '#ffffff'
                        }}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono" style={{ color: '#6b6b70' }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
                      {alert.message}
                    </p>
                    {alert.breach_attempts && (
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#a0a0a5' }}>
                        <span>Variance: {alert.breach_attempts.variance_percentage?.toFixed(2)}%</span>
                        <span>Device: {alert.device_hash.substring(0, 16)}...</span>
                      </div>
                    )}
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
                      color: '#0d0d0f'
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

