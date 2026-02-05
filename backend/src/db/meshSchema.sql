-- PFF Backend — VLT Darknet Protocol Sync Schema
-- Architect: Isreal Okoro (mrfundzman)
-- 
-- Tables for peer-to-peer discovery, gossip protocol, encrypted hopping, and offline verification

-- ============================================================================
-- OFFLINE VERIFICATION
-- ============================================================================

-- Offline verification templates (stored in TEE)
CREATE TABLE IF NOT EXISTS offline_verification_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id),
  pff_id                TEXT NOT NULL,
  device_id             TEXT NOT NULL,
  face_template_hash    TEXT NOT NULL,
  finger_template_hash  TEXT NOT NULL,
  heart_template_hash   TEXT NOT NULL,
  voice_template_hash   TEXT NOT NULL,
  composite_hash        TEXT NOT NULL,
  tee_attestation_hash  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at      TIMESTAMPTZ,
  UNIQUE(citizen_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_offline_templates_citizen ON offline_verification_templates(citizen_id);
CREATE INDEX IF NOT EXISTS idx_offline_templates_device ON offline_verification_templates(device_id);

-- Offline verification log
CREATE TABLE IF NOT EXISTS offline_verification_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            TEXT NOT NULL,
  citizen_id            UUID NOT NULL,
  device_id             TEXT NOT NULL,
  verification_status   TEXT NOT NULL,  -- 'SUCCESS' | 'FAILED'
  composite_hash        TEXT NOT NULL,
  timestamp             TIMESTAMPTZ NOT NULL,
  sync_pending          BOOLEAN NOT NULL DEFAULT true,
  synced_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_offline_log_device ON offline_verification_log(device_id);
CREATE INDEX IF NOT EXISTS idx_offline_log_sync ON offline_verification_log(sync_pending);

-- ============================================================================
-- PEER DISCOVERY
-- ============================================================================

-- Peer advertisements (BLE and WiFi)
CREATE TABLE IF NOT EXISTS mesh_peer_advertisements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_id               TEXT NOT NULL,
  device_id             TEXT NOT NULL UNIQUE,
  pff_id                TEXT,
  device_name           TEXT NOT NULL,
  discovery_method      TEXT NOT NULL,  -- 'BLE' | 'WIFI'
  public_key            TEXT NOT NULL,
  advertised_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_ads_method ON mesh_peer_advertisements(discovery_method);
CREATE INDEX IF NOT EXISTS idx_peer_ads_time ON mesh_peer_advertisements(advertised_at);

-- Peer connections
CREATE TABLE IF NOT EXISTS mesh_peer_connections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_device_id       TEXT NOT NULL,
  peer_id               TEXT NOT NULL,
  peer_device_id        TEXT NOT NULL,
  shared_secret         TEXT NOT NULL,
  connection_status     TEXT NOT NULL,  -- 'CONNECTED' | 'DISCONNECTED' | 'FAILED'
  connected_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at       TIMESTAMPTZ,
  UNIQUE(local_device_id, peer_device_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_conn_local ON mesh_peer_connections(local_device_id);
CREATE INDEX IF NOT EXISTS idx_peer_conn_status ON mesh_peer_connections(connection_status);

-- ============================================================================
-- GOSSIP PROTOCOL
-- ============================================================================

-- Vector clocks for causal ordering
CREATE TABLE IF NOT EXISTS mesh_vector_clocks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id             TEXT NOT NULL UNIQUE,
  vector_clock          JSONB NOT NULL,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vector_clocks_device ON mesh_vector_clocks(device_id);

-- Truth packets (VLT updates)
CREATE TABLE IF NOT EXISTS mesh_truth_packets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id             TEXT NOT NULL UNIQUE,
  device_id             TEXT NOT NULL,
  pff_id                TEXT,
  transaction_type      TEXT NOT NULL,
  transaction_hash      TEXT NOT NULL,
  citizen_id            UUID,
  amount                NUMERIC(20, 8),
  from_vault            TEXT,
  to_vault              TEXT,
  metadata              JSONB,
  timestamp             TIMESTAMPTZ NOT NULL,
  vector_clock          JSONB NOT NULL,
  signature             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_truth_packets_device ON mesh_truth_packets(device_id);
CREATE INDEX IF NOT EXISTS idx_truth_packets_hash ON mesh_truth_packets(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_truth_packets_time ON mesh_truth_packets(timestamp);

-- Packet sync log
CREATE TABLE IF NOT EXISTS mesh_packet_sync_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id             TEXT NOT NULL,
  peer_device_id        TEXT NOT NULL,
  sync_direction        TEXT NOT NULL,  -- 'SENT' | 'RECEIVED'
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(packet_id, peer_device_id)
);

CREATE INDEX IF NOT EXISTS idx_packet_sync_peer ON mesh_packet_sync_log(peer_device_id);

-- Gossip sessions
CREATE TABLE IF NOT EXISTS mesh_gossip_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            TEXT NOT NULL UNIQUE,
  local_device_id       TEXT NOT NULL,
  peer_device_id        TEXT NOT NULL,
  packets_sent          INTEGER DEFAULT 0,
  packets_received      INTEGER DEFAULT 0,
  started_at            TIMESTAMPTZ NOT NULL,
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL  -- 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
);

CREATE INDEX IF NOT EXISTS idx_gossip_sessions_local ON mesh_gossip_sessions(local_device_id);
CREATE INDEX IF NOT EXISTS idx_gossip_sessions_status ON mesh_gossip_sessions(status);

-- ============================================================================
-- ENCRYPTED HOPPING
-- ============================================================================

-- Encrypted hops (offline vitalization storage)
CREATE TABLE IF NOT EXISTS mesh_encrypted_hops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hop_id                TEXT NOT NULL UNIQUE,
  vitalization_id       TEXT NOT NULL,
  origin_device_id      TEXT NOT NULL,
  storage_device_id     TEXT NOT NULL,
  encrypted_payload     TEXT NOT NULL,
  encryption_key        TEXT NOT NULL,
  hop_count             INTEGER NOT NULL,
  max_hops              INTEGER NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  forwarded_at          TIMESTAMPTZ,
  acknowledged_at       TIMESTAMPTZ,
  status                TEXT NOT NULL  -- 'STORED' | 'FORWARDED' | 'DELIVERED' | 'EXPIRED'
);

CREATE INDEX IF NOT EXISTS idx_encrypted_hops_vitalization ON mesh_encrypted_hops(vitalization_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_hops_storage ON mesh_encrypted_hops(storage_device_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_hops_status ON mesh_encrypted_hops(status);

-- Hop acknowledgments
CREATE TABLE IF NOT EXISTS mesh_hop_acknowledgments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitalization_id       TEXT NOT NULL,
  hop_path              JSONB NOT NULL,
  acknowledged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hop_acks_vitalization ON mesh_hop_acknowledgments(vitalization_id);

