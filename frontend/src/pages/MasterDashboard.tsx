/**
 * PFF Frontend — Master Dashboard (Architect's Eye)
 * Supreme oversight dashboard for the Root Sentinel Node
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/masterDashboard.css';

// ============================================================================
// TYPES
// ============================================================================

interface HardwareLockStatus {
  isAuthorized: boolean;
  rootPairVerified: boolean;
  genesisHandshakeVerified: boolean;
  alphaNodeStatus: 'ALPHA_NODE_ACTIVE' | 'ALPHA_NODE_STASIS' | 'ALPHA_NODE_COMPROMISED';
  lastVerificationTimestamp: string;
}

interface VitalizationDensity {
  countryCode: string;
  countryName: string;
  latitude: number;
  longitude: number;
  totalVitalizations: number;
  activeThisMonth: number;
  growthVelocity: number;
  aiPredictedGrowth: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface NationDeathClock {
  nationCode: string;
  nationName: string;
  lastSNATActivity: string;
  daysSinceLastActivity: number;
  daysUntilFlush: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'IMMINENT';
  totalCitizens: number;
  totalVidaCap: number;
}

interface RevenueTelemetry {
  sentinelTreasury: {
    tier1Intakes: number;
    tier2Intakes: number;
    tier3Intakes: number;
    totalRevenue: number;
    totalActivations: number;
  };
  sovereignMovement: {
    totalOnePercent: number;
    nationalEscrow: number;
    globalCitizenBlock: number;
  };
  architectMasterBlock: {
    ninetyNinePercent: number;
    tenPercentProtocol: number;
    totalArchitectBalance: number;
  };
}

interface AIGovernanceLog {
  logId: string;
  timestamp: string;
  decisionType: string;
  description: string;
  affectedEntities: string[];
  outcome: 'SUCCESS' | 'FAILED' | 'PENDING';
  metadata: Record<string, unknown>;
}

interface HeartbeatSyncStatus {
  isActive: boolean;
  lastHeartbeat: string;
  heartbeatInterval: number;
  missedHeartbeats: number;
  overrideEnabled: boolean;
}

// ============================================================================
// MASTER DASHBOARD COMPONENT
// ============================================================================

export default function MasterDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hardwareLock, setHardwareLock] = useState<HardwareLockStatus | null>(null);
  const [vitalizationDensity, setVitalizationDensity] = useState<VitalizationDensity[]>([]);
  const [nationDeathClocks, setNationDeathClocks] = useState<NationDeathClock[]>([]);
  const [revenueTelemetry, setRevenueTelemetry] = useState<RevenueTelemetry | null>(null);
  const [aiGovernanceLogs, setAIGovernanceLogs] = useState<AIGovernanceLog[]>([]);
  const [heartbeatSession, setHeartbeatSession] = useState<string | null>(null);
  const [heartbeatStatus, setHeartbeatStatus] = useState<HeartbeatSyncStatus | null>(null);

  // ============================================================================
  // HARDWARE LOCK VERIFICATION
  // ============================================================================

  const verifyHardwareLock = useCallback(async () => {
    try {
      // In production, these would come from device hardware
      const deviceUUID = 'HP_LAPTOP_UUID_12345';
      const hardwareTPMHash = 'TPM_HASH_ABCDEF';
      const handshakeSignature = 'GENESIS_HASH_SIGNATURE';

      const response = await fetch('/api/master-dashboard/verify-hardware-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceUUID, hardwareTPMHash, handshakeSignature }),
      });

      const data = await response.json();

      if (data.success && data.authorized) {
        setIsAuthorized(true);
        setHardwareLock({
          isAuthorized: data.authorized,
          rootPairVerified: data.rootPairVerified,
          genesisHandshakeVerified: data.genesisHandshakeVerified,
          alphaNodeStatus: data.alphaNodeStatus,
          lastVerificationTimestamp: data.lastVerificationTimestamp,
        });
      } else {
        setIsAuthorized(false);
        console.error('Hardware lock verification failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to verify hardware lock:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // LOAD DASHBOARD DATA
  // ============================================================================

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/master-dashboard/full-status');
      const data = await response.json();

      if (data.success) {
        setVitalizationDensity(data.data.vitalizationDensity);
        setNationDeathClocks(data.data.nationDeathClocks);
        setRevenueTelemetry(data.data.revenueTelemetry);
        setAIGovernanceLogs(data.data.aiGovernanceLogs);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  // ============================================================================
  // HEARTBEAT SYNC
  // ============================================================================

  const initializeHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/master-dashboard/heartbeat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceUUID: 'HP_LAPTOP_UUID_12345' }),
      });

      const data = await response.json();

      if (data.success) {
        setHeartbeatSession(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to initialize heartbeat:', error);
    }
  }, []);

  const updateHeartbeat = useCallback(async () => {
    if (!heartbeatSession) return;

    try {
      const response = await fetch('/api/master-dashboard/heartbeat/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: heartbeatSession }),
      });

      const data = await response.json();

      if (data.success) {
        setHeartbeatStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to update heartbeat:', error);
    }
  }, [heartbeatSession]);

  // ============================================================================
  // MASTER OVERRIDE
  // ============================================================================

  const executeMasterOverride = async (
    overrideType: 'EMERGENCY_STASIS' | 'FORCE_FLUSH' | 'SYSTEM_RESET' | 'MANUAL_INTERVENTION',
    targetEntity: string,
    reason: string
  ) => {
    if (!heartbeatSession || !heartbeatStatus?.overrideEnabled) {
      alert('MASTER_OVERRIDE denied: Heartbeat-sync not active');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ MASTER_OVERRIDE CONFIRMATION ⚠️\n\n` +
      `Type: ${overrideType}\n` +
      `Target: ${targetEntity}\n` +
      `Reason: ${reason}\n\n` +
      `This action cannot be undone. Proceed?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/master-dashboard/master-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: heartbeatSession, overrideType, targetEntity, reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}`);
        loadDashboardData(); // Reload dashboard data
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to execute MASTER_OVERRIDE:', error);
      alert('❌ Failed to execute MASTER_OVERRIDE');
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    verifyHardwareLock();
  }, [verifyHardwareLock]);

  useEffect(() => {
    if (isAuthorized) {
      loadDashboardData();
      initializeHeartbeat();

      // Refresh dashboard data every 10 seconds
      const dataInterval = setInterval(loadDashboardData, 10000);

      return () => clearInterval(dataInterval);
    }
  }, [isAuthorized, loadDashboardData, initializeHeartbeat]);

  useEffect(() => {
    if (heartbeatSession) {
      // Send heartbeat every 5 seconds
      const heartbeatInterval = setInterval(updateHeartbeat, 5000);

      return () => clearInterval(heartbeatInterval);
    }
  }, [heartbeatSession, updateHeartbeat]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className=\"master-dashboard-loading\">
        <div className=\"loading-spinner\"></div>
        <p>VERIFYING ROOT_SOVEREIGN_PAIR...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className=\"master-dashboard-unauthorized\">
        <div className=\"unauthorized-icon\">🔒</div>
        <h1>ACCESS DENIED</h1>
        <p>ROOT_SOVEREIGN_PAIR verification failed.</p>
        <p>This dashboard requires Genesis Authority.</p>
        <div className=\"unauthorized-details\">
          <p>Root Pair Verified: {hardwareLock?.rootPairVerified ? '✅' : '❌'}</p>
          <p>Genesis Handshake Verified: {hardwareLock?.genesisHandshakeVerified ? '✅' : '❌'}</p>
          <p>Alpha Node Status: {hardwareLock?.alphaNodeStatus || 'UNKNOWN'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"master-dashboard\">
      {/* Header */}
      <header className=\"dashboard-header\">
        <div className=\"header-left\">
          <h1>🏛️ ARCHITECT'S EYE</h1>
          <p className=\"subtitle\">Master Dashboard — Root Sentinel Node</p>
        </div>
        <div className=\"header-right\">
          <div className=\"alpha-status\">
            <span className={`status-badge ${hardwareLock?.alphaNodeStatus.toLowerCase()}`}>
              {hardwareLock?.alphaNodeStatus}
            </span>
          </div>
          <div className=\"heartbeat-indicator\">
            <span className={`heartbeat-dot ${heartbeatStatus?.isActive ? 'active' : 'inactive'}`}></span>
            <span>{heartbeatStatus?.isActive ? 'HEARTBEAT ACTIVE' : 'HEARTBEAT INACTIVE'}</span>
          </div>
        </div>
      </header>

      <div className=\"dashboard-content\">
        {/* Main Grid */}
        <div className=\"dashboard-grid\">
          {/* Global Heatmap */}
          <section className=\"dashboard-card heatmap-card\">
            <h2>🌍 Global Vitalization Density</h2>
            <div className=\"heatmap-container\">
              <div className=\"heatmap-placeholder\">
                <p>World Map Visualization</p>
                <p className=\"heatmap-note\">(Integration with mapping library required)</p>
              </div>
              <div className=\"density-legend\">
                <div className=\"legend-item\"><span className=\"dot low\"></span> Low (&lt;100)</div>
                <div className=\"legend-item\"><span className=\"dot medium\"></span> Medium (100-1K)</div>
                <div className=\"legend-item\"><span className=\"dot high\"></span> High (1K-10K)</div>
                <div className=\"legend-item\"><span className=\"dot critical\"></span> Critical (&gt;10K)</div>
              </div>
            </div>
            <div className=\"density-stats\">
              <p>Total Countries: {vitalizationDensity.length}</p>
              <p>Growth Nodes Detected: {vitalizationDensity.filter(d => d.growthVelocity > 1).length}</p>
            </div>
          </section>

          {/* Revenue Flow Analytics */}
          <section className=\"dashboard-card revenue-card\">
            <h2>💰 Revenue Flow Analytics</h2>
            {revenueTelemetry && (
              <div className=\"revenue-grid\">
                <div className=\"revenue-block sentinel-treasury\">
                  <h3>Sentinel Treasury</h3>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Tier 1 ($10):</span>
                    <span className=\"value\">${revenueTelemetry.sentinelTreasury.tier1Intakes.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Tier 2 ($30):</span>
                    <span className=\"value\">${revenueTelemetry.sentinelTreasury.tier2Intakes.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Tier 3 ($1000):</span>
                    <span className=\"value\">${revenueTelemetry.sentinelTreasury.tier3Intakes.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat total\">
                    <span className=\"label\">Total Revenue:</span>
                    <span className=\"value\">${revenueTelemetry.sentinelTreasury.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Activations:</span>
                    <span className=\"value\">{revenueTelemetry.sentinelTreasury.totalActivations.toLocaleString()}</span>
                  </div>
                </div>

                <div className=\"revenue-block sovereign-movement\">
                  <h3>1% Sovereign Movement</h3>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Total 1%:</span>
                    <span className=\"value\">${revenueTelemetry.sovereignMovement.totalOnePercent.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">National Escrow (0.5%):</span>
                    <span className=\"value\">${revenueTelemetry.sovereignMovement.nationalEscrow.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">Citizen Block (0.5%):</span>
                    <span className=\"value\">${revenueTelemetry.sovereignMovement.globalCitizenBlock.toLocaleString()}</span>
                  </div>
                </div>

                <div className=\"revenue-block architect-block\">
                  <h3>Architect's Master Block</h3>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">99% Retention:</span>
                    <span className=\"value\">${revenueTelemetry.architectMasterBlock.ninetyNinePercent.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat\">
                    <span className=\"label\">10% Protocol:</span>
                    <span className=\"value\">${revenueTelemetry.architectMasterBlock.tenPercentProtocol.toLocaleString()}</span>
                  </div>
                  <div className=\"revenue-stat total\">
                    <span className=\"label\">Total Balance:</span>
                    <span className=\"value\">${revenueTelemetry.architectMasterBlock.totalArchitectBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* AI Governance Feed */}
          <section className=\"dashboard-card ai-feed-card\">
            <h2>🤖 AI Governance Feed</h2>
            <div className=\"ai-logs-container\">
              {aiGovernanceLogs.length === 0 ? (
                <p className=\"no-logs\">No AI governance logs yet</p>
              ) : (
                aiGovernanceLogs.map(log => (
                  <div key={log.logId} className={`ai-log ${log.outcome.toLowerCase()}`}>
                    <div className=\"log-header\">
                      <span className=\"log-type\">{log.decisionType}</span>
                      <span className=\"log-time\">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className=\"log-description\">{log.description}</p>
                    <div className=\"log-footer\">
                      <span className=\"log-outcome\">{log.outcome}</span>
                      <span className=\"log-entities\">Affected: {log.affectedEntities.join(', ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Ultimatum Monitor */}
        <aside className=\"dashboard-sidebar\">
          <section className=\"sidebar-card death-clock-card\">
            <h2>⏰ Ultimatum Monitor</h2>
            <p className=\"subtitle\">180-Day SNAT Countdown</p>
            <div className=\"death-clocks-container\">
              {nationDeathClocks.length === 0 ? (
                <p className=\"no-data\">No nation data available</p>
              ) : (
                nationDeathClocks.map(nation => (
                  <div key={nation.nationCode} className={`death-clock ${nation.status.toLowerCase()}`}>
                    <div className=\"nation-header\">
                      <span className=\"nation-name\">{nation.nationName}</span>
                      <span className=\"nation-code\">{nation.nationCode}</span>
                    </div>
                    <div className=\"countdown\">
                      <span className=\"days\">{nation.daysUntilFlush}</span>
                      <span className=\"label\">days until flush</span>
                    </div>
                    <div className=\"nation-stats\">
                      <p>Citizens: {nation.totalCitizens.toLocaleString()}</p>
                      <p>VIDA Cap: {nation.totalVidaCap.toLocaleString()}</p>
                    </div>
                    <div className=\"status-badge\">{nation.status}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Emergency Command Console */}
          <section className=\"sidebar-card emergency-console-card\">
            <h2>🚨 Emergency Command Console</h2>
            <div className=\"heartbeat-status\">
              <p>Heartbeat: {heartbeatStatus?.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}</p>
              <p>Override: {heartbeatStatus?.overrideEnabled ? '✅ ENABLED' : '🔒 LOCKED'}</p>
            </div>
            <div className=\"override-buttons\">
              <button
                className=\"override-btn emergency-stasis\"
                disabled={!heartbeatStatus?.overrideEnabled}
                onClick={() => executeMasterOverride('EMERGENCY_STASIS', 'GLOBAL_SYSTEM', 'Manual emergency stasis trigger')}
              >
                🛑 EMERGENCY STASIS
              </button>
              <button
                className=\"override-btn force-flush\"
                disabled={!heartbeatStatus?.overrideEnabled}
                onClick={() => executeMasterOverride('FORCE_FLUSH', 'GLOBAL_CITIZEN_BLOCK', 'Manual dividend flush')}
              >
                💸 FORCE FLUSH
              </button>
              <button
                className=\"override-btn system-reset\"
                disabled={!heartbeatStatus?.overrideEnabled}
                onClick={() => executeMasterOverride('SYSTEM_RESET', 'ALPHA_NODE', 'Manual system reset')}
              >
                🔄 SYSTEM RESET
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}


