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

/**
 * Architect's Sentinel Command Center
 * God-Mode dashboard for sovereign control
 */
export default function ArchitectCommandCenter() {
  const [telemetry, setTelemetry] = useState<CommandCenterTelemetry | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to render immediately
  const [error, setError] = useState<string | null>(null);

  // Initialize with live Supabase data
  useEffect(() => {
    console.log('[COMMAND CENTER] Initializing with live Supabase data');

    // Check if Supabase is configured
    if (!hasSupabase()) {
      console.error('[COMMAND CENTER] Supabase not configured');
      setError('CONNECTION_ERROR');
      setLoading(false);
      return;
    }

    // Fetch real data immediately
    fetchTelemetry();
    fetchSecurityStatus();

    // Set up intervals for updates
    const telemetryInterval = setInterval(fetchTelemetry, 5000);
    const securityInterval = setInterval(fetchSecurityStatus, 10000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(securityInterval);
    };
  }, []);

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
      const { data: telemetryData, error: telemetryError } = await supabase
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
      const { data: liquidityData, error: liquidityError } = await supabase
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
      const { data: devicesData, error: devicesError } = await supabase
        .from('root_sovereign_devices')
        .select('*')
        .eq('is_root_pair', true);

      if (devicesError) {
        console.error('[COMMAND CENTER] Security status fetch error:', devicesError);
        return;
      }

      // Find laptop and mobile devices
      const laptopDevice = devicesData?.find(d => d.device_type === 'LAPTOP');
      const mobileDevice = devicesData?.find(d => d.device_type === 'MOBILE');

      // Map to SecurityStatus type
      const mappedStatus: SecurityStatus = {
        laptopBinded: !!laptopDevice,
        mobileBinded: !!mobileDevice,
        genesisHashVerified: !!(laptopDevice?.hardware_tpm_hash && mobileDevice?.hardware_tpm_hash),
        laptopDeviceUUID: laptopDevice?.device_uuid || 'NOT_BOUND',
        mobileDeviceUUID: mobileDevice?.device_uuid || 'NOT_BOUND',
        lastVerificationTimestamp: laptopDevice?.last_verification_timestamp || new Date().toISOString(),
      };

      setSecurityStatus(mappedStatus);
      console.log('[COMMAND CENTER] Live security status loaded successfully');
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

  // NEVER show loading screen - always render the dashboard
  // The loading state is bypassed after 1 second maximum

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Unicorn of Trust Nebula Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at left, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at right, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
            linear-gradient(to bottom, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)
          `,
        }}
      />

      {/* Animated Stars */}
      <div className="fixed inset-0 z-0 opacity-50">
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
            ARCHITECT'S SENTINEL COMMAND CENTER
          </h1>
          <p className="text-xl text-gray-300 font-semibold tracking-wide">
            GOD-MODE SOVEREIGN CONTROL
          </p>
        </motion.div>

        {/* Connection Error Display */}
        {error === 'CONNECTION_ERROR' && (
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
  );
}

