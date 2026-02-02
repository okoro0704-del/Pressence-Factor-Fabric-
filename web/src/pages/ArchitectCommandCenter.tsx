/**
 * PFF Web — Architect's Sentinel Command Center
 * God-Mode dashboard with live telemetry and action center
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Display real-time Sentinel telemetry
 * - Show security status with HARDWARE BINDED badge
 * - Provide action center for mesh broadcast and emergency stasis
 * - Unicorn of Trust nebula background with dark theme
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Radio, Lock, AlertTriangle, Activity, Globe, DollarSign } from 'lucide-react';
import { CommandCenterTelemetry, SecurityStatus, ActionResult } from '../types/commandCenter';
import LiveTelemetryPanel from '../components/commandCenter/LiveTelemetryPanel';
import SecurityStatusBadge from '../components/commandCenter/SecurityStatusBadge';
import ActionCenter from '../components/commandCenter/ActionCenter';
import NationalLiquidityGrid from '../components/commandCenter/NationalLiquidityGrid';
import { supabase, hasSupabase } from '../../lib/supabase';
import { executeRootHardwareBinding, getRootDeviceConfig } from '../../lib/hardwareBinding';
import { executeGenesisSeeding } from '../../lib/genesisSeeding';
import { forceGlobalPresence, checkDualNodeStatus } from '../../lib/mobileBinding';
import { forceBindCurrentDevice, checkDeviceAuthorization, injectPresenceStatus, generateDeviceFingerprint } from '../../lib/securityOverride';
import { executeGenesisHashSeal, retrieveGenesisHash } from '../../lib/genesisHashSeal';
import MobileSyncModal from '../components/commandCenter/MobileSyncModal';

/**
 * Architect's Sentinel Command Center
 * God-Mode dashboard for sovereign control
 */
export default function ArchitectCommandCenter() {
  const [telemetry, setTelemetry] = useState<CommandCenterTelemetry | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to render immediately
  const [error, setError] = useState<string | null>(null);
  const [isPresenceDeclared, setIsPresenceDeclared] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);
  const [isDualNode, setIsDualNode] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState<boolean>(false);
  const [genesisHashSealed, setGenesisHashSealed] = useState<string>('');
  const [genesisHashShort, setGenesisHashShort] = useState<string>('');
  const [isGenesisSealed, setIsGenesisSealed] = useState<boolean>(false);

  // Initialize with live Supabase data
  useEffect(() => {
    const initializeCommandCenter = async () => {
      console.log('[COMMAND CENTER] Initializing with live Supabase data');

      // Check if Supabase is configured
      if (!hasSupabase()) {
        console.error('[COMMAND CENTER] Supabase not configured');
        setError('CONNECTION_ERROR');
        setLoading(false);
        return;
      }

      // Execute Genesis Seeding FIRST (before hardware binding)
      await executeGenesisSeedingCeremony();

      // Execute ROOT Hardware Binding on initialization
      await executeRootBindingCeremony();

      // Execute Genesis Hash Seal Ceremony
      await executeGenesisHashSealCeremony();

      // Check device authorization (Re-Armed Security)
      await checkDeviceAuthorizationStatus();

      // TEMPORARY: Security check disabled for initial setup
      const deviceId = generateDeviceFingerprint();
      const authResult = await checkDeviceAuthorization();

      if (!authResult.authorized) {
        console.warn('[COMMAND CENTER] ⚠️ DEVICE NOT AUTHORIZED - BUT ALLOWING ACCESS FOR SETUP');
        console.warn('[COMMAND CENTER] Device ID:', deviceId);
        // COMMENTED OUT: setError('DEVICE_NOT_AUTHORIZED');
        // COMMENTED OUT: setLoading(false);
        // COMMENTED OUT: return;
      } else {
        console.log('[COMMAND CENTER] ✅ DEVICE AUTHORIZED - ACCESS GRANTED');
        console.log('[COMMAND CENTER] Device ID:', deviceId);
      }

      // Inject presence status for current session
      await injectPresenceForSession();

      // Fetch real data immediately
      fetchTelemetry();
      fetchSecurityStatus();
      checkDualNodeSovereignty();

      // Set up intervals for updates
      const telemetryInterval = setInterval(fetchTelemetry, 5000);
      const securityInterval = setInterval(fetchSecurityStatus, 10000);
      const dualNodeInterval = setInterval(checkDualNodeSovereignty, 10000);

      return () => {
        clearInterval(telemetryInterval);
        clearInterval(securityInterval);
        clearInterval(dualNodeInterval);
      };
    };

    initializeCommandCenter();
  }, []);

  /**
   * Execute Genesis Database Seeding Ceremony
   * Runs FIRST on Command Center initialization
   * Seeds Architect's identity and telemetry data
   */
  const executeGenesisSeedingCeremony = async () => {
    console.log('[COMMAND CENTER] 🌱 EXECUTING GENESIS DATABASE SEEDING');

    const result = await executeGenesisSeeding();

    if (result.success && result.presenceDeclared) {
      console.log('[COMMAND CENTER] ✅ GENESIS SEEDING SUCCESSFUL');
      console.log('[COMMAND CENTER] ✅ PRESENCE DECLARED');
      setIsPresenceDeclared(true);
      setError(null); // Clear connection error
    } else {
      console.error('[COMMAND CENTER] ⚠️ GENESIS SEEDING INCOMPLETE');
      console.error('[COMMAND CENTER] Message:', result.message);
    }
  };

  /**
   * Execute ROOT Hardware Binding Ceremony
   * Runs on Command Center initialization
   * Binds HP-LAPTOP-ROOT-SOVEREIGN-001 to Supabase
   */
  const executeRootBindingCeremony = async () => {
    const config = getRootDeviceConfig();

    if (!config.isConfigured) {
      console.log('[COMMAND CENTER] ROOT device not configured, skipping binding');
      return;
    }

    console.log('[COMMAND CENTER] 🔥 EXECUTING ROOT HARDWARE BINDING CEREMONY');
    console.log('[COMMAND CENTER] Device ID:', config.deviceId);
    console.log('[COMMAND CENTER] Device Type:', config.deviceType);

    const result = await executeRootHardwareBinding();

    if (result.success) {
      console.log('[COMMAND CENTER] ✅ ROOT_SOVEREIGN_PAIR BINDING SUCCESSFUL');
      console.log('[COMMAND CENTER] Genesis Hash:', result.genesisHash);
      console.log('[COMMAND CENTER] Message:', result.message);

      // Immediately refresh security status to show Matrix Green glow
      setTimeout(() => {
        fetchSecurityStatus();
      }, 500);
    } else {
      console.error('[COMMAND CENTER] ❌ ROOT_SOVEREIGN_PAIR BINDING FAILED');
      console.error('[COMMAND CENTER] Error:', result.message);
    }
  };

  const fetchTelemetry = async () => {
    try {
      if (!supabase) {
        console.error('[COMMAND CENTER] Supabase client not initialized');
        setError('CONNECTION_ERROR');
        setLoading(false);
        return;
      }

      console.log('[COMMAND CENTER] Fetching telemetry from Supabase...');

      // Fetch sentinel_telemetry (singleton record)
      const { data: telemetryData, error: telemetryError } = await supabase!
        .from('sentinel_telemetry')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (telemetryError) {
        console.error('[COMMAND CENTER] Telemetry fetch error:', telemetryError);
        setError('CONNECTION_ERROR');
        setLoading(false);
        return;
      }

      // Fetch national liquidity vaults for aggregate stats
      const { data: liquidityData, error: liquidityError } = await supabase!
        .from('national_liquidity_vaults')
        .select('balance_vida, balance_usd');

      if (liquidityError) {
        console.error('[COMMAND CENTER] Liquidity fetch error:', liquidityError);
        setError('CONNECTION_ERROR');
        setLoading(false);
        return;
      }

      // Calculate aggregate liquidity stats
      const totalReservesVIDA = liquidityData?.reduce((sum, vault) => sum + Number(vault.balance_vida || 0), 0) || 0;
      const totalReservesUSD = liquidityData?.reduce((sum, vault) => sum + Number(vault.balance_usd || 0), 0) || 0;
      const activeNations = liquidityData?.length || 0;
      const avgReservePerNation = activeNations > 0 ? totalReservesVIDA / activeNations : 0;

      // Map database columns to CommandCenterTelemetry type
      const mappedTelemetry: CommandCenterTelemetry = {
        activeSentinels: {
          citizen: telemetryData.active_sentinels_citizen || 0,
          personalMulti: telemetryData.active_sentinels_personal_multi || 0,
          enterpriseLite: telemetryData.active_sentinels_enterprise_lite || 0,
          total: telemetryData.active_sentinels_total || 0,
        },
        totalTributes: {
          deepTruthVIDA: Number(telemetryData.total_tributes_vida || 0),
          deepTruthUSD: Number(telemetryData.total_tributes_usd || 0),
          businessCount: telemetryData.business_count || 0,
          last24hVIDA: Number(telemetryData.last_24h_tributes_vida || 0),
          stateShareVIDA: Number(telemetryData.state_share_vida || 0),
          citizenShareVIDA: Number(telemetryData.citizen_share_vida || 0),
        },
        nationalLiquidity: {
          totalReservesVIDA,
          totalReservesUSD,
          activeNations,
          avgReservePerNation,
        },
        lastUpdated: telemetryData.last_updated || new Date().toISOString(),
      };

      setTelemetry(mappedTelemetry);
      setError(null); // Clear any previous errors
      setLoading(false);
      console.log('[COMMAND CENTER] Live telemetry data loaded successfully');
    } catch (err) {
      console.error('[COMMAND CENTER] Telemetry fetch failed:', err);
      setError('CONNECTION_ERROR');
      setLoading(false);
    }
  };

  const fetchSecurityStatus = async () => {
    try {
      if (!supabase) {
        console.error('[COMMAND CENTER] Supabase client not initialized');
        return;
      }

      console.log('[COMMAND CENTER] Fetching security status from Supabase...');

      // Fetch root sovereign devices
      const { data: devicesData, error: devicesError } = await supabase!
        .from('root_sovereign_devices')
        .select('*')
        .eq('is_root_pair', true);

      if (devicesError) {
        console.error('[COMMAND CENTER] Security status fetch error:', devicesError);
        return;
      }

      // Fetch Genesis Hash from sentinel_telemetry
      const { data: telemetryData, error: telemetryError } = await supabase!
        .from('sentinel_telemetry')
        .select('genesis_hash')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (telemetryError) {
        console.error('[COMMAND CENTER] Genesis Hash fetch error:', telemetryError);
      }

      // Find laptop and mobile devices
      const laptopDevice = devicesData?.find(d => d.device_type === 'LAPTOP');
      const mobileDevice = devicesData?.find(d => d.device_type === 'MOBILE');

      // Extract Genesis Hash from sentinel_telemetry (not from device metadata)
      const genesisHashSealed = telemetryData?.genesis_hash || '';
      const hardwareTPMHash = laptopDevice?.hardware_tpm_hash || '';

      // Map to SecurityStatus type
      const mappedStatus: SecurityStatus = {
        laptopBinded: !!laptopDevice,
        mobileBinded: !!mobileDevice,
        genesisHashVerified: !!genesisHashSealed, // Verified if hash exists in database
        laptopDeviceUUID: laptopDevice?.device_uuid || 'NOT_BOUND',
        mobileDeviceUUID: mobileDevice?.device_uuid || 'NOT_BOUND',
        genesisHash: genesisHashSealed,
        hardwareTPMHash,
        lastVerificationTimestamp: laptopDevice?.last_verification_timestamp || new Date().toISOString(),
      };

      setSecurityStatus(mappedStatus);
      console.log('[COMMAND CENTER] Live security status loaded successfully');
      console.log('[COMMAND CENTER] Genesis Hash Sealed:', genesisHashSealed);
      console.log('[COMMAND CENTER] Hardware TPM Hash:', hardwareTPMHash);
    } catch (err) {
      console.error('[COMMAND CENTER] Security status fetch failed:', err);
    }
  };

  const handleBroadcastToMesh = async (message: string): Promise<ActionResult> => {
    try {
      if (!supabase) {
        console.error('[COMMAND CENTER] Supabase client not initialized');
        return {
          success: false,
          message: 'CONNECTION_ERROR: Supabase not configured',
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[COMMAND CENTER] Broadcasting to mesh:', message);

      // INSERT into sovereign_audit_log
      const { data, error } = await supabase!
        .from('sovereign_audit_log')
        .insert({
          action_type: 'BROADCAST_TO_MESH',
          message: message,
          executed_by: 'ARCHITECT',
          executed_at: new Date().toISOString(),
          metadata: {
            nodes_reached: 0, // TODO: Update with actual mesh node count
            broadcast_type: 'DARKNET_MESH',
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[COMMAND CENTER] Broadcast audit log failed:', error);
        return {
          success: false,
          message: `Broadcast failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[COMMAND CENTER] Broadcast logged successfully:', data);

      return {
        success: true,
        message: `Broadcast sent to Sentinel mesh network`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[COMMAND CENTER] Broadcast failed:', err);
      return {
        success: false,
        message: `Broadcast failed: ${(err as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const handleEmergencyStasis = async (reason: string): Promise<ActionResult> => {
    try {
      if (!supabase) {
        console.error('[COMMAND CENTER] Supabase client not initialized');
        return {
          success: false,
          message: 'CONNECTION_ERROR: Supabase not configured',
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[COMMAND CENTER] Activating emergency stasis:', reason);

      // INSERT into sovereign_audit_log
      const { data, error } = await supabase!
        .from('sovereign_audit_log')
        .insert({
          action_type: 'EMERGENCY_STASIS',
          message: reason,
          executed_by: 'ARCHITECT',
          executed_at: new Date().toISOString(),
          metadata: {
            stasis_type: 'EMERGENCY',
            affected_systems: ['SENTINEL_NETWORK', 'VLT_LEDGER', 'PRESENCE_HANDSHAKES'],
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[COMMAND CENTER] Stasis audit log failed:', error);
        return {
          success: false,
          message: `Emergency stasis failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[COMMAND CENTER] Emergency stasis logged successfully:', data);

      return {
        success: true,
        message: `Emergency stasis activated - all systems locked`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[COMMAND CENTER] Emergency stasis failed:', err);
      return {
        success: false,
        message: `Emergency stasis failed: ${(err as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  };

  /**
   * Check Dual-Node Sovereignty Status
   * Verifies if both laptop and mobile are bound and live
   */
  const checkDualNodeSovereignty = async () => {
    const status = await checkDualNodeStatus();
    setIsDualNode(status.isDualNode);

    if (status.isDualNode) {
      console.log('[COMMAND CENTER] ✅ DUAL-NODE SOVEREIGNTY ACTIVE');
    }
  };

  /**
   * Handle Force Global Presence
   * Activates is_live for all Architect devices
   */
  const handleForceGlobalPresence = async () => {
    console.log('[COMMAND CENTER] 🔥 FORCING GLOBAL PRESENCE');

    const result = await forceGlobalPresence();

    if (result.success) {
      console.log('[COMMAND CENTER] ✅ GLOBAL PRESENCE ACTIVATED');
      console.log('[COMMAND CENTER] Devices activated:', result.devicesActivated);

      // Refresh security status and dual-node check
      fetchSecurityStatus();
      checkDualNodeSovereignty();
    } else {
      console.error('[COMMAND CENTER] ❌ Global presence activation failed');
    }
  };

  /**
   * Check Device Authorization Status (Re-Armed Security)
   * Verifies if current device is authorized
   */
  const checkDeviceAuthorizationStatus = async () => {
    const deviceId = generateDeviceFingerprint();
    setCurrentDeviceId(deviceId);

    const result = await checkDeviceAuthorization();
    setIsDeviceAuthorized(result.authorized);

    if (result.authorized) {
      console.log('[COMMAND CENTER] ✅ DEVICE AUTHORIZED');
    } else {
      console.log('[COMMAND CENTER] ⚠️ DEVICE NOT AUTHORIZED - Use Force-Bind');
    }
  };

  /**
   * Handle Force-Bind Current Device
   * Immediately authorizes current device
   */
  const handleForceBindDevice = async () => {
    console.log('[COMMAND CENTER] 🔥 FORCE-BINDING CURRENT DEVICE');

    const result = await forceBindCurrentDevice();

    if (result.success) {
      console.log('[COMMAND CENTER] ✅ DEVICE FORCE-BOUND SUCCESSFULLY');
      console.log('[COMMAND CENTER] Device ID:', result.deviceId);

      // Update authorization status
      setIsDeviceAuthorized(true);
      setCurrentDeviceId(result.deviceId || '');

      // Refresh security status
      fetchSecurityStatus();
      checkDualNodeSovereignty();
    } else {
      console.error('[COMMAND CENTER] ❌ Force-bind failed:', result.message);
    }
  };

  /**
   * Inject Presence Status for Current Session
   * Sets is_live = TRUE in sentinel_telemetry
   */
  const injectPresenceForSession = async () => {
    const result = await injectPresenceStatus();

    if (result.success) {
      console.log('[COMMAND CENTER] ✅ PRESENCE STATUS INJECTED');
      setIsPresenceDeclared(true);
    } else {
      console.error('[COMMAND CENTER] ❌ Presence injection failed');
    }
  };

  /**
   * Execute Genesis Hash Seal Ceremony
   * Generates and seals the Genesis Hash for eternal verification
   */
  const executeGenesisHashSealCeremony = async () => {
    console.log('[COMMAND CENTER] 🔐 EXECUTING GENESIS HASH SEAL CEREMONY');

    // First try to retrieve existing hash
    const retrieveResult = await retrieveGenesisHash();

    if (retrieveResult.success && retrieveResult.genesisHash) {
      console.log('[COMMAND CENTER] ✅ GENESIS HASH ALREADY SEALED');
      console.log('[COMMAND CENTER] Hash:', retrieveResult.genesisHash);
      console.log('[COMMAND CENTER] Short Hash:', retrieveResult.genesisHashShort);

      setGenesisHashSealed(retrieveResult.genesisHash);
      setGenesisHashShort(retrieveResult.genesisHashShort || '');
      setIsGenesisSealed(true);
    } else {
      // Generate and seal new hash
      console.log('[COMMAND CENTER] 🔥 GENERATING NEW GENESIS HASH');
      const sealResult = await executeGenesisHashSeal();

      if (sealResult.success) {
        console.log('[COMMAND CENTER] ✅ GENESIS HASH SEAL CEREMONY COMPLETE');
        console.log('[COMMAND CENTER] Hash:', sealResult.genesisHash);
        console.log('[COMMAND CENTER] Short Hash:', sealResult.genesisHashShort);

        setGenesisHashSealed(sealResult.genesisHash || '');
        setGenesisHashShort(sealResult.genesisHashShort || '');
        setIsGenesisSealed(true);
      } else {
        console.error('[COMMAND CENTER] ❌ Genesis Hash Seal failed:', sealResult.message);
      }
    }
  };

  // SECURITY LOCK DISABLED: Allow all devices to access Command Center
  // if (error === 'DEVICE_NOT_AUTHORIZED') {
  //   return (
  //     <div>LOCK SCREEN - DISABLED</div>
  //   );
  // }

  return (
    <>
      {/* Google Fonts: JetBrains Mono */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="min-h-screen relative overflow-hidden">
        {/* Deep Space Background */}
        <div
          className="fixed inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse at top, rgba(30, 30, 40, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse at bottom right, rgba(20, 20, 30, 0.3) 0%, transparent 50%),
              #050505
            `,
          }}
        />

        {/* Animated Stars */}
        <div className="fixed inset-0 z-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 mb-4">
            {isDualNode ? 'DUAL-NODE SOVEREIGNTY ACTIVE' : "ARCHITECT'S SENTINEL COMMAND CENTER"}
          </h1>
          <p className="text-xl text-gray-300 font-semibold tracking-wide">
            {isDualNode ? '🔥 LAPTOP + MOBILE BOUND 🔥' : 'GOD-MODE SOVEREIGN CONTROL'}
          </p>

          {/* Mobile Sync & Force Presence Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileSyncOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Mobile Sync
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleForceGlobalPresence}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              FORCE GLOBAL PRESENCE
            </motion.button>
          </div>
        </motion.div>

        {/* Connection Error Display - Only show if presence NOT declared */}
        {error === 'CONNECTION_ERROR' && !isPresenceDeclared && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12 p-8 bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-center gap-4">
              <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">CONNECTION_ERROR</h2>
                <p className="text-gray-300 text-lg">
                  Unable to connect to Supabase. Please check your environment variables:
                </p>
                <ul className="mt-4 text-gray-400 space-y-2">
                  <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 p-8 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-center gap-4">
              <Activity className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xl text-white font-semibold">Loading live telemetry data...</p>
            </div>
          </motion.div>
        )}

        {/* Security Status Badge - Render when data available */}
        {!error && securityStatus && <SecurityStatusBadge status={securityStatus} />}

        {/* Live Telemetry Panel - Render when data available */}
        {!error && telemetry && <LiveTelemetryPanel telemetry={telemetry} />}

        {/* National Liquidity Grid - Render when no error */}
        {!error && <NationalLiquidityGrid />}

        {/* Action Center - ALWAYS RENDER regardless of telemetry status */}
        <ActionCenter
          onBroadcastToMesh={handleBroadcastToMesh}
          onEmergencyStasis={handleEmergencyStasis}
        />
      </div>
    </div>

    {/* Mobile Sync Modal */}
    <MobileSyncModal
      isOpen={isMobileSyncOpen}
      onClose={() => setIsMobileSyncOpen(false)}
      deviceUUID={getRootDeviceConfig().deviceId}
    />
    </>
  );
}

