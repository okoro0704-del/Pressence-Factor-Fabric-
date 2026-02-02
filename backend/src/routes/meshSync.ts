/**
 * PFF Backend — VLT Darknet Mesh Sync API Routes
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * API endpoints for:
 * - Offline verification
 * - Peer discovery and connection
 * - Gossip protocol execution
 * - Encrypted hopping
 */

import { Router, Request, Response } from 'express';
import {
  generateOfflineTemplate,
  verifyOfflineHandshake,
  syncOfflineVerifications,
} from '../mesh/offlineVerification';
import {
  advertisePeer,
  scanBLEPeers,
  scanWiFiPeers,
  connectToPeer,
  updatePeerHeartbeat,
  getConnectedPeers,
  disconnectFromPeer,
} from '../mesh/peerDiscovery';
import {
  createTruthPacket,
  executeGossipProtocol,
} from '../mesh/gossipProtocol';
import {
  storeEncryptedHop,
  forwardEncryptedHop,
  deliverToServer,
  processPendingHops,
} from '../mesh/encryptedHopping';

const router = Router();

// ============================================================================
// OFFLINE VERIFICATION ROUTES
// ============================================================================

/**
 * POST /api/mesh/offline-verification/generate-template
 * Generate offline verification template from 4-layer handshake
 */
router.post('/offline-verification/generate-template', async (req: Request, res: Response) => {
  try {
    const {
      citizenId,
      pffId,
      deviceId,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      teeAttestation,
    } = req.body;

    const template = await generateOfflineTemplate(
      citizenId,
      pffId,
      deviceId,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      teeAttestation
    );

    res.json({
      success: true,
      template: {
        citizenId: template.citizenId,
        pffId: template.pffId,
        deviceId: template.deviceId,
        compositeHash: template.compositeHash,
        createdAt: template.createdAt,
      },
      message: 'Offline verification template generated successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to generate offline template:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate offline verification template',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/offline-verification/verify
 * Verify 4-layer handshake offline using stored template
 */
router.post('/offline-verification/verify', async (req: Request, res: Response) => {
  try {
    const handshakeData = req.body;

    const result = await verifyOfflineHandshake(handshakeData);

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        verifiedOffline: result.verifiedOffline,
        compositeHash: result.compositeHash,
        timestamp: result.timestamp,
        syncRequired: result.syncRequired,
        message: 'Offline handshake verified successfully',
      });
    } else {
      res.status(401).json({
        success: false,
        sessionId: result.sessionId,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to verify offline handshake:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify offline handshake',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/offline-verification/sync
 * Sync offline verification logs to central VLT
 */
router.post('/offline-verification/sync', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;

    const syncedCount = await syncOfflineVerifications(deviceId);

    res.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} offline verifications to VLT`,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to sync offline verifications:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to sync offline verifications',
      details: err.message,
    });
  }
});

// ============================================================================
// PEER DISCOVERY ROUTES
// ============================================================================

/**
 * POST /api/mesh/peer/advertise
 * Advertise this device as a Sentinel peer
 */
router.post('/peer/advertise', async (req: Request, res: Response) => {
  try {
    const { deviceId, pffId, deviceName, publicKey, discoveryMethod } = req.body;

    const peerId = await advertisePeer(deviceId, pffId, deviceName, publicKey, discoveryMethod);

    res.json({
      success: true,
      peerId,
      message: 'Peer advertisement created successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to advertise peer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to advertise peer',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/peer/scan-ble
 * Scan for nearby Sentinel peers via BLE
 */
router.post('/peer/scan-ble', async (req: Request, res: Response) => {
  try {
    const { deviceId, scanDuration } = req.body;

    const peers = await scanBLEPeers(deviceId, scanDuration || 5000);

    res.json({
      success: true,
      peers,
      count: peers.length,
      message: `Found ${peers.length} BLE peers`,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to scan BLE peers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to scan BLE peers',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/peer/scan-wifi
 * Scan for nearby Sentinel peers via WiFi
 */
router.post('/peer/scan-wifi', async (req: Request, res: Response) => {
  try {
    const { deviceId, scanDuration } = req.body;

    const peers = await scanWiFiPeers(deviceId, scanDuration || 5000);

    res.json({
      success: true,
      peers,
      count: peers.length,
      message: `Found ${peers.length} WiFi peers`,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to scan WiFi peers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to scan WiFi peers',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/peer/connect
 * Connect to discovered peer
 */
router.post('/peer/connect', async (req: Request, res: Response) => {
  try {
    const { localDeviceId, localPrivateKey, peerInfo } = req.body;

    const result = await connectToPeer(localDeviceId, localPrivateKey, peerInfo);

    if (result.success) {
      res.json({
        success: true,
        peerId: result.peerId,
        sharedSecret: result.sharedSecret,
        message: 'Connected to peer successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        peerId: result.peerId,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to connect to peer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to peer',
      details: err.message,
    });
  }
});

/**
 * GET /api/mesh/peer/connected/:deviceId
 * Get all connected peers for device
 */
router.get('/peer/connected/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const peers = await getConnectedPeers(deviceId);

    res.json({
      success: true,
      peers,
      count: peers.length,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to get connected peers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected peers',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/peer/heartbeat
 * Update peer heartbeat
 */
router.post('/peer/heartbeat', async (req: Request, res: Response) => {
  try {
    const { localDeviceId, peerDeviceId } = req.body;

    await updatePeerHeartbeat(localDeviceId, peerDeviceId);

    res.json({
      success: true,
      message: 'Peer heartbeat updated',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to update peer heartbeat:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update peer heartbeat',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/peer/disconnect
 * Disconnect from peer
 */
router.post('/peer/disconnect', async (req: Request, res: Response) => {
  try {
    const { localDeviceId, peerDeviceId } = req.body;

    await disconnectFromPeer(localDeviceId, peerDeviceId);

    res.json({
      success: true,
      message: 'Disconnected from peer',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to disconnect from peer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect from peer',
      details: err.message,
    });
  }
});

// ============================================================================
// GOSSIP PROTOCOL ROUTES
// ============================================================================

/**
 * POST /api/mesh/gossip/execute
 * Execute gossip protocol with connected peer
 */
router.post('/gossip/execute', async (req: Request, res: Response) => {
  try {
    const { localDeviceId, peerDeviceId, sharedSecret } = req.body;

    const result = await executeGossipProtocol(localDeviceId, peerDeviceId, sharedSecret);

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        packetsSent: result.packetsSent,
        packetsReceived: result.packetsReceived,
        conflictsResolved: result.conflictsResolved,
        message: 'Gossip protocol executed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        sessionId: result.sessionId,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to execute gossip protocol:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to execute gossip protocol',
      details: err.message,
    });
  }
});

// ============================================================================
// ENCRYPTED HOPPING ROUTES
// ============================================================================

/**
 * POST /api/mesh/hop/store
 * Store encrypted vitalization data on neighbor device
 */
router.post('/hop/store', async (req: Request, res: Response) => {
  try {
    const {
      vitalizationData,
      originDeviceId,
      storageDeviceId,
      storageDevicePublicKey,
      hopCount,
      maxHops,
    } = req.body;

    const result = await storeEncryptedHop(
      vitalizationData,
      originDeviceId,
      storageDeviceId,
      storageDevicePublicKey,
      hopCount,
      maxHops
    );

    if (result.success) {
      res.json({
        success: true,
        hopId: result.hopId,
        storageDeviceId: result.storageDeviceId,
        hopCount: result.hopCount,
        message: 'Encrypted hop stored successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to store encrypted hop:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to store encrypted hop',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/hop/forward
 * Forward encrypted hop to next device
 */
router.post('/hop/forward', async (req: Request, res: Response) => {
  try {
    const { hopId, nextDeviceId, nextDevicePublicKey, storageDevicePrivateKey } = req.body;

    const result = await forwardEncryptedHop(
      hopId,
      nextDeviceId,
      nextDevicePublicKey,
      storageDevicePrivateKey
    );

    if (result.success) {
      res.json({
        success: true,
        hopId: result.hopId,
        storageDeviceId: result.storageDeviceId,
        hopCount: result.hopCount,
        message: 'Encrypted hop forwarded successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to forward encrypted hop:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to forward encrypted hop',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/hop/deliver
 * Deliver encrypted hop to central server
 */
router.post('/hop/deliver', async (req: Request, res: Response) => {
  try {
    const { hopId, storageDevicePrivateKey, serverUrl } = req.body;

    const result = await deliverToServer(hopId, storageDevicePrivateKey, serverUrl);

    if (result.success) {
      res.json({
        success: true,
        vitalizationId: result.vitalizationId,
        deliveredToServer: result.deliveredToServer,
        hopPath: result.hopPath,
        message: 'Encrypted hop delivered to server successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to deliver encrypted hop:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to deliver encrypted hop',
      details: err.message,
    });
  }
});

/**
 * POST /api/mesh/hop/process-pending
 * Process all pending hops when device comes online
 */
router.post('/hop/process-pending', async (req: Request, res: Response) => {
  try {
    const { deviceId, devicePrivateKey, serverUrl } = req.body;

    const deliveredCount = await processPendingHops(deviceId, devicePrivateKey, serverUrl);

    res.json({
      success: true,
      deliveredCount,
      message: `Delivered ${deliveredCount} pending hops to server`,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MESH SYNC] Failed to process pending hops:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process pending hops',
      details: err.message,
    });
  }
});

export default router;

