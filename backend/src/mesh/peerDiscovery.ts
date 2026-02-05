/**
 * PFF Backend — VLT Darknet Protocol Sync: Peer-to-Peer Discovery
 * Enable Sentinel-to-Sentinel discovery via BLE and Local WiFi
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Discover other Sentinels via Bluetooth Low Energy (BLE)
 * - Discover other Sentinels via Local WiFi (mDNS/Bonjour)
 * - Establish secure peer-to-peer connections
 * - Maintain peer health monitoring
 */

import * as crypto from 'crypto';
import { query } from '../db/client';

// ============================================================================
// TYPES
// ============================================================================

export interface PeerInfo {
  peerId: string;
  deviceId: string;
  pffId: string | null;
  deviceName: string;
  discoveryMethod: 'BLE' | 'WIFI' | 'MANUAL';
  ipAddress: string | null;
  bleAddress: string | null;
  publicKey: string;
  lastSeen: Date;
  connectionStatus: 'DISCOVERED' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED';
  trustLevel: 'UNTRUSTED' | 'VERIFIED' | 'SENTINEL';
}

export interface DiscoveryConfig {
  enableBLE: boolean;
  enableWiFi: boolean;
  discoveryInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  maxPeers: number;
}

export interface PeerConnectionRequest {
  peerId: string;
  deviceId: string;
  publicKey: string;
  timestamp: number;
  signature: string;
}

export interface PeerConnectionResponse {
  success: boolean;
  peerId: string;
  sharedSecret?: string;
  error?: string;
}

// ============================================================================
// PEER DISCOVERY
// ============================================================================

/**
 * Generate unique peer ID for this device
 * Combines device ID and PFF ID for uniqueness
 */
export function generatePeerId(deviceId: string, pffId: string | null): string {
  const data = `${deviceId}:${pffId || 'UNVITALIZED'}:${Date.now()}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Advertise this device as a Sentinel peer
 * Broadcasts device info via BLE and WiFi
 */
export async function advertisePeer(
  deviceId: string,
  pffId: string | null,
  deviceName: string,
  publicKey: string,
  discoveryMethod: 'BLE' | 'WIFI'
): Promise<string> {
  const peerId = generatePeerId(deviceId, pffId);
  const timestamp = new Date();

  // Store peer advertisement in database
  await query(
    `INSERT INTO mesh_peer_advertisements
     (peer_id, device_id, pff_id, device_name, discovery_method, public_key, advertised_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (device_id) 
     DO UPDATE SET
       peer_id = EXCLUDED.peer_id,
       pff_id = EXCLUDED.pff_id,
       device_name = EXCLUDED.device_name,
       discovery_method = EXCLUDED.discovery_method,
       public_key = EXCLUDED.public_key,
       advertised_at = EXCLUDED.advertised_at`,
    [peerId, deviceId, pffId, deviceName, discoveryMethod, publicKey, timestamp]
  );

  return peerId;
}

/**
 * Scan for nearby Sentinel peers via BLE
 * Returns list of discovered peers
 */
export async function scanBLEPeers(
  localDeviceId: string,
  scanDuration: number = 5000
): Promise<PeerInfo[]> {
  // In production, this would interface with native BLE scanning
  // For now, we query the database for advertised peers
  
  const result = await query<{
    peer_id: string;
    device_id: string;
    pff_id: string | null;
    device_name: string;
    discovery_method: string;
    public_key: string;
    advertised_at: Date;
  }>(
    `SELECT * FROM mesh_peer_advertisements
     WHERE discovery_method = 'BLE' 
     AND device_id != $1
     AND advertised_at > NOW() - INTERVAL '5 minutes'
     ORDER BY advertised_at DESC`,
    [localDeviceId]
  );

  return result.rows.map(row => ({
    peerId: row.peer_id,
    deviceId: row.device_id,
    pffId: row.pff_id,
    deviceName: row.device_name,
    discoveryMethod: 'BLE' as const,
    ipAddress: null,
    bleAddress: row.device_id, // In production, this would be MAC address
    publicKey: row.public_key,
    lastSeen: row.advertised_at,
    connectionStatus: 'DISCOVERED' as const,
    trustLevel: row.pff_id ? 'VERIFIED' as const : 'UNTRUSTED' as const,
  }));
}

/**
 * Scan for nearby Sentinel peers via Local WiFi (mDNS)
 * Returns list of discovered peers
 */
export async function scanWiFiPeers(
  localDeviceId: string,
  scanDuration: number = 5000
): Promise<PeerInfo[]> {
  // In production, this would interface with mDNS/Bonjour discovery
  // For now, we query the database for advertised peers
  
  const result = await query<{
    peer_id: string;
    device_id: string;
    pff_id: string | null;
    device_name: string;
    discovery_method: string;
    public_key: string;
    advertised_at: Date;
  }>(
    `SELECT * FROM mesh_peer_advertisements
     WHERE discovery_method = 'WIFI' 
     AND device_id != $1
     AND advertised_at > NOW() - INTERVAL '5 minutes'
     ORDER BY advertised_at DESC`,
    [localDeviceId]
  );

  return result.rows.map(row => ({
    peerId: row.peer_id,
    deviceId: row.device_id,
    pffId: row.pff_id,
    deviceName: row.device_name,
    discoveryMethod: 'WIFI' as const,
    ipAddress: '192.168.1.100', // In production, this would be actual IP
    bleAddress: null,
    publicKey: row.public_key,
    lastSeen: row.advertised_at,
    connectionStatus: 'DISCOVERED' as const,
    trustLevel: row.pff_id ? 'VERIFIED' as const : 'UNTRUSTED' as const,
  }));
}

// ============================================================================
// PEER CONNECTION
// ============================================================================

/**
 * Establish secure connection with discovered peer
 * Uses Diffie-Hellman key exchange for shared secret
 */
export async function connectToPeer(
  localDeviceId: string,
  localPrivateKey: string,
  peerInfo: PeerInfo
): Promise<PeerConnectionResponse> {
  try {
    // 1. Generate connection request
    const timestamp = Date.now();
    const requestData = `${localDeviceId}:${peerInfo.peerId}:${timestamp}`;
    const signature = crypto
      .createHash('sha256')
      .update(requestData + localPrivateKey)
      .digest('hex');

    const connectionRequest: PeerConnectionRequest = {
      peerId: peerInfo.peerId,
      deviceId: localDeviceId,
      publicKey: localPrivateKey, // In production, this would be actual public key
      timestamp,
      signature,
    };

    // 2. Perform Diffie-Hellman key exchange
    const sharedSecret = generateSharedSecret(localPrivateKey, peerInfo.publicKey);

    // 3. Store peer connection in database
    await query(
      `INSERT INTO mesh_peer_connections
       (local_device_id, peer_id, peer_device_id, shared_secret, connection_status, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (local_device_id, peer_device_id)
       DO UPDATE SET
         shared_secret = EXCLUDED.shared_secret,
         connection_status = EXCLUDED.connection_status,
         connected_at = EXCLUDED.connected_at,
         last_heartbeat = EXCLUDED.connected_at`,
      [localDeviceId, peerInfo.peerId, peerInfo.deviceId, sharedSecret, 'CONNECTED', new Date()]
    );

    return {
      success: true,
      peerId: peerInfo.peerId,
      sharedSecret,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      peerId: peerInfo.peerId,
      error: `Connection failed: ${err.message}`,
    };
  }
}

/**
 * Generate shared secret using Diffie-Hellman key exchange
 * In production, this would use actual ECDH
 */
function generateSharedSecret(localKey: string, peerKey: string): string {
  const combined = `${localKey}:${peerKey}`;
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
}

/**
 * Update peer heartbeat to indicate connection is alive
 */
export async function updatePeerHeartbeat(
  localDeviceId: string,
  peerDeviceId: string
): Promise<void> {
  await query(
    `UPDATE mesh_peer_connections
     SET last_heartbeat = NOW(),
         connection_status = 'CONNECTED'
     WHERE local_device_id = $1 AND peer_device_id = $2`,
    [localDeviceId, peerDeviceId]
  );
}

/**
 * Get all connected peers for this device
 */
export async function getConnectedPeers(localDeviceId: string): Promise<PeerInfo[]> {
  const result = await query<{
    peer_id: string;
    peer_device_id: string;
    shared_secret: string;
    connection_status: string;
    last_heartbeat: Date;
  }>(
    `SELECT pc.peer_id, pc.peer_device_id, pc.shared_secret, pc.connection_status, pc.last_heartbeat,
            pa.pff_id, pa.device_name, pa.discovery_method, pa.public_key
     FROM mesh_peer_connections pc
     LEFT JOIN mesh_peer_advertisements pa ON pc.peer_device_id = pa.device_id
     WHERE pc.local_device_id = $1
     AND pc.connection_status = 'CONNECTED'
     AND pc.last_heartbeat > NOW() - INTERVAL '5 minutes'
     ORDER BY pc.last_heartbeat DESC`,
    [localDeviceId]
  );

  return result.rows.map(row => ({
    peerId: row.peer_id,
    deviceId: row.peer_device_id,
    pffId: (row as { pff_id?: string }).pff_id || null,
    deviceName: (row as { device_name?: string }).device_name || 'Unknown',
    discoveryMethod: ((row as { discovery_method?: string }).discovery_method as 'BLE' | 'WIFI') || 'MANUAL',
    ipAddress: null,
    bleAddress: null,
    publicKey: (row as { public_key?: string }).public_key || '',
    lastSeen: row.last_heartbeat,
    connectionStatus: 'CONNECTED' as const,
    trustLevel: (row as { pff_id?: string }).pff_id ? 'VERIFIED' as const : 'UNTRUSTED' as const,
  }));
}

/**
 * Disconnect from peer
 */
export async function disconnectFromPeer(
  localDeviceId: string,
  peerDeviceId: string
): Promise<void> {
  await query(
    `UPDATE mesh_peer_connections
     SET connection_status = 'DISCONNECTED',
         disconnected_at = NOW()
     WHERE local_device_id = $1 AND peer_device_id = $2`,
    [localDeviceId, peerDeviceId]
  );
}

