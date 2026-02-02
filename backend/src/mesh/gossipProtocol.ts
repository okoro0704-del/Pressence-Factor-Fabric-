/**
 * PFF Backend — VLT Darknet Mesh Sync: Gossip Protocol
 * Automatic Truth Packet swapping between connected Sentinels
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Automatically swap VLT updates (Truth Packets) when Sentinels connect
 * - Ensure ledger stays synced without central server
 * - Implement conflict resolution for distributed consensus
 * - Use vector clocks for causal ordering
 */

import * as crypto from 'crypto';
import { query } from '../db/client';

// ============================================================================
// TYPES
// ============================================================================

export interface TruthPacket {
  packetId: string;
  deviceId: string;
  pffId: string | null;
  transactionType: string;
  transactionHash: string;
  citizenId: string | null;
  amount: number;
  fromVault: string | null;
  toVault: string | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
  vectorClock: VectorClock;
  signature: string;
}

export interface VectorClock {
  [deviceId: string]: number;
}

export interface GossipSession {
  sessionId: string;
  localDeviceId: string;
  peerDeviceId: string;
  packetsSent: number;
  packetsReceived: number;
  startedAt: Date;
  completedAt: Date | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface GossipResult {
  success: boolean;
  sessionId: string;
  packetsSent: number;
  packetsReceived: number;
  conflictsResolved: number;
  error?: string;
}

// ============================================================================
// TRUTH PACKET CREATION
// ============================================================================

/**
 * Create Truth Packet from VLT transaction
 * Includes vector clock for causal ordering
 */
export async function createTruthPacket(
  deviceId: string,
  pffId: string | null,
  transactionType: string,
  transactionHash: string,
  citizenId: string | null,
  amount: number,
  fromVault: string | null,
  toVault: string | null,
  metadata: Record<string, unknown>,
  privateKey: string
): Promise<TruthPacket> {
  const packetId = crypto.randomUUID();
  const timestamp = new Date();

  // Get current vector clock for this device
  const vectorClock = await getVectorClock(deviceId);
  
  // Increment this device's clock
  vectorClock[deviceId] = (vectorClock[deviceId] || 0) + 1;

  // Create signature
  const dataToSign = JSON.stringify({
    packetId,
    deviceId,
    transactionType,
    transactionHash,
    timestamp: timestamp.toISOString(),
    vectorClock,
  });

  const signature = crypto
    .createHash('sha256')
    .update(dataToSign + privateKey)
    .digest('hex');

  const packet: TruthPacket = {
    packetId,
    deviceId,
    pffId,
    transactionType,
    transactionHash,
    citizenId,
    amount,
    fromVault,
    toVault,
    metadata,
    timestamp,
    vectorClock,
    signature,
  };

  // Store packet locally
  await storeTruthPacket(packet);

  return packet;
}

/**
 * Get current vector clock for device
 */
async function getVectorClock(deviceId: string): Promise<VectorClock> {
  const result = await query<{ vector_clock: VectorClock }>(
    `SELECT vector_clock FROM mesh_vector_clocks WHERE device_id = $1`,
    [deviceId]
  );

  if (result.rows.length === 0) {
    // Initialize vector clock
    const initialClock: VectorClock = { [deviceId]: 0 };
    await query(
      `INSERT INTO mesh_vector_clocks (device_id, vector_clock) VALUES ($1, $2)`,
      [deviceId, JSON.stringify(initialClock)]
    );
    return initialClock;
  }

  return result.rows[0].vector_clock;
}

/**
 * Update vector clock after receiving packets
 */
async function updateVectorClock(
  deviceId: string,
  receivedClock: VectorClock
): Promise<void> {
  const currentClock = await getVectorClock(deviceId);

  // Merge clocks (take maximum for each device)
  const mergedClock: VectorClock = { ...currentClock };
  
  for (const [device, count] of Object.entries(receivedClock)) {
    mergedClock[device] = Math.max(mergedClock[device] || 0, count);
  }

  // Increment local device's clock
  mergedClock[deviceId] = (mergedClock[deviceId] || 0) + 1;

  await query(
    `UPDATE mesh_vector_clocks SET vector_clock = $1, updated_at = NOW() WHERE device_id = $2`,
    [JSON.stringify(mergedClock), deviceId]
  );
}

/**
 * Store Truth Packet in local database
 */
async function storeTruthPacket(packet: TruthPacket): Promise<void> {
  await query(
    `INSERT INTO mesh_truth_packets
     (packet_id, device_id, pff_id, transaction_type, transaction_hash, citizen_id,
      amount, from_vault, to_vault, metadata, timestamp, vector_clock, signature)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (packet_id) DO NOTHING`,
    [
      packet.packetId,
      packet.deviceId,
      packet.pffId,
      packet.transactionType,
      packet.transactionHash,
      packet.citizenId,
      packet.amount,
      packet.fromVault,
      packet.toVault,
      JSON.stringify(packet.metadata),
      packet.timestamp,
      JSON.stringify(packet.vectorClock),
      packet.signature,
    ]
  );
}

// ============================================================================
// GOSSIP PROTOCOL EXECUTION
// ============================================================================

/**
 * Execute gossip protocol with connected peer
 * Automatically swaps Truth Packets to sync ledgers
 */
export async function executeGossipProtocol(
  localDeviceId: string,
  peerDeviceId: string,
  sharedSecret: string
): Promise<GossipResult> {
  const sessionId = crypto.randomUUID();
  const startedAt = new Date();

  try {
    // 1. Create gossip session
    await query(
      `INSERT INTO mesh_gossip_sessions
       (session_id, local_device_id, peer_device_id, started_at, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, localDeviceId, peerDeviceId, startedAt, 'IN_PROGRESS']
    );

    // 2. Get packets to send (packets peer doesn't have)
    const packetsToSend = await getPacketsToSend(localDeviceId, peerDeviceId);

    // 3. Send packets to peer
    let packetsSent = 0;
    for (const packet of packetsToSend) {
      await sendPacketToPeer(packet, peerDeviceId, sharedSecret);
      packetsSent++;
    }

    // 4. Receive packets from peer
    const receivedPackets = await receivePacketsFromPeer(peerDeviceId, localDeviceId, sharedSecret);
    let packetsReceived = receivedPackets.length;

    // 5. Resolve conflicts using vector clocks
    let conflictsResolved = 0;
    for (const packet of receivedPackets) {
      const resolved = await resolveConflict(localDeviceId, packet);
      if (resolved) conflictsResolved++;
    }

    // 6. Update gossip session
    await query(
      `UPDATE mesh_gossip_sessions
       SET packets_sent = $1,
           packets_received = $2,
           completed_at = NOW(),
           status = 'COMPLETED'
       WHERE session_id = $3`,
      [packetsSent, packetsReceived, sessionId]
    );

    return {
      success: true,
      sessionId,
      packetsSent,
      packetsReceived,
      conflictsResolved,
    };
  } catch (error) {
    const err = error as Error;

    // Mark session as failed
    await query(
      `UPDATE mesh_gossip_sessions
       SET status = 'FAILED',
           completed_at = NOW()
       WHERE session_id = $1`,
      [sessionId]
    );

    return {
      success: false,
      sessionId,
      packetsSent: 0,
      packetsReceived: 0,
      conflictsResolved: 0,
      error: `Gossip protocol failed: ${err.message}`,
    };
  }
}

/**
 * Get packets that peer doesn't have
 */
async function getPacketsToSend(
  localDeviceId: string,
  peerDeviceId: string
): Promise<TruthPacket[]> {
  const result = await query<{
    packet_id: string;
    device_id: string;
    pff_id: string | null;
    transaction_type: string;
    transaction_hash: string;
    citizen_id: string | null;
    amount: number;
    from_vault: string | null;
    to_vault: string | null;
    metadata: string;
    timestamp: Date;
    vector_clock: string;
    signature: string;
  }>(
    `SELECT * FROM mesh_truth_packets
     WHERE packet_id NOT IN (
       SELECT packet_id FROM mesh_packet_sync_log
       WHERE peer_device_id = $1
     )
     ORDER BY timestamp ASC
     LIMIT 100`,
    [peerDeviceId]
  );

  return result.rows.map(row => ({
    packetId: row.packet_id,
    deviceId: row.device_id,
    pffId: row.pff_id,
    transactionType: row.transaction_type,
    transactionHash: row.transaction_hash,
    citizenId: row.citizen_id,
    amount: row.amount,
    fromVault: row.from_vault,
    toVault: row.to_vault,
    metadata: JSON.parse(row.metadata),
    timestamp: row.timestamp,
    vectorClock: JSON.parse(row.vector_clock),
    signature: row.signature,
  }));
}

/**
 * Send packet to peer (encrypted with shared secret)
 */
async function sendPacketToPeer(
  packet: TruthPacket,
  peerDeviceId: string,
  sharedSecret: string
): Promise<void> {
  // In production, this would send over BLE/WiFi
  // For now, we log the sync
  await query(
    `INSERT INTO mesh_packet_sync_log
     (packet_id, peer_device_id, sync_direction, synced_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (packet_id, peer_device_id) DO NOTHING`,
    [packet.packetId, peerDeviceId, 'SENT']
  );
}

/**
 * Receive packets from peer
 */
async function receivePacketsFromPeer(
  peerDeviceId: string,
  localDeviceId: string,
  sharedSecret: string
): Promise<TruthPacket[]> {
  // In production, this would receive over BLE/WiFi
  // For now, we query packets from peer that we don't have
  const result = await query<{
    packet_id: string;
    device_id: string;
    pff_id: string | null;
    transaction_type: string;
    transaction_hash: string;
    citizen_id: string | null;
    amount: number;
    from_vault: string | null;
    to_vault: string | null;
    metadata: string;
    timestamp: Date;
    vector_clock: string;
    signature: string;
  }>(
    `SELECT * FROM mesh_truth_packets
     WHERE device_id = $1
     AND packet_id NOT IN (
       SELECT packet_id FROM mesh_packet_sync_log
       WHERE peer_device_id = $2 AND sync_direction = 'RECEIVED'
     )
     ORDER BY timestamp ASC
     LIMIT 100`,
    [peerDeviceId, localDeviceId]
  );

  const packets = result.rows.map(row => ({
    packetId: row.packet_id,
    deviceId: row.device_id,
    pffId: row.pff_id,
    transactionType: row.transaction_type,
    transactionHash: row.transaction_hash,
    citizenId: row.citizen_id,
    amount: row.amount,
    fromVault: row.from_vault,
    toVault: row.to_vault,
    metadata: JSON.parse(row.metadata),
    timestamp: row.timestamp,
    vectorClock: JSON.parse(row.vector_clock),
    signature: row.signature,
  }));

  // Store received packets
  for (const packet of packets) {
    await storeTruthPacket(packet);
    await query(
      `INSERT INTO mesh_packet_sync_log
       (packet_id, peer_device_id, sync_direction, synced_at)
       VALUES ($1, $2, $3, NOW())`,
      [packet.packetId, localDeviceId, 'RECEIVED']
    );
  }

  return packets;
}

/**
 * Resolve conflict using vector clocks
 * Returns true if conflict was resolved
 */
async function resolveConflict(
  localDeviceId: string,
  receivedPacket: TruthPacket
): Promise<boolean> {
  // Check if we have a conflicting packet
  const existingResult = await query<{
    packet_id: string;
    vector_clock: string;
    timestamp: Date;
  }>(
    `SELECT packet_id, vector_clock, timestamp FROM mesh_truth_packets
     WHERE transaction_hash = $1 AND packet_id != $2`,
    [receivedPacket.transactionHash, receivedPacket.packetId]
  );

  if (existingResult.rows.length === 0) {
    // No conflict
    await updateVectorClock(localDeviceId, receivedPacket.vectorClock);
    return false;
  }

  const existing = existingResult.rows[0];
  const existingClock: VectorClock = JSON.parse(existing.vector_clock);

  // Compare vector clocks to determine causal order
  const receivedHappensAfter = happensBefore(existingClock, receivedPacket.vectorClock);
  const existingHappensAfter = happensBefore(receivedPacket.vectorClock, existingClock);

  if (receivedHappensAfter && !existingHappensAfter) {
    // Received packet is newer, keep it
    await query(
      `DELETE FROM mesh_truth_packets WHERE packet_id = $1`,
      [existing.packet_id]
    );
    await updateVectorClock(localDeviceId, receivedPacket.vectorClock);
    return true;
  } else if (existingHappensAfter && !receivedHappensAfter) {
    // Existing packet is newer, discard received
    return true;
  } else {
    // Concurrent events, use timestamp as tiebreaker
    if (receivedPacket.timestamp > existing.timestamp) {
      await query(
        `DELETE FROM mesh_truth_packets WHERE packet_id = $1`,
        [existing.packet_id]
      );
      await updateVectorClock(localDeviceId, receivedPacket.vectorClock);
      return true;
    }
    return true;
  }
}

/**
 * Check if clock1 happens before clock2
 */
function happensBefore(clock1: VectorClock, clock2: VectorClock): boolean {
  let hasSmaller = false;

  for (const device in clock1) {
    if (clock1[device] > (clock2[device] || 0)) {
      return false;
    }
    if (clock1[device] < (clock2[device] || 0)) {
      hasSmaller = true;
    }
  }

  return hasSmaller;
}

