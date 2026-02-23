/**
 * Merkle tree: combine pillar hashes (face, palm, identity anchor) into a single root hash.
 * All hashes are SHA-256 (64 hex chars). Leaves are the pillar hashes; internal nodes are
 * SHA-256(left || right). Stored in Supabase as sovereign_root / citizen_root.
 */

const HASH_HEX_LENGTH = 64;

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build Merkle root from an array of leaf hashes (each 64-char hex).
 * If odd number of leaves, duplicate the last so we can pair. Then hash level by level.
 */
export async function merkleRootFromLeaves(leaves: string[]): Promise<string> {
  if (leaves.length === 0) throw new Error('merkleRootFromLeaves: at least one leaf required');
  const normalized = leaves.map((l) => String(l).trim().toLowerCase());
  if (normalized.some((l) => l.length !== HASH_HEX_LENGTH || !/^[0-9a-f]+$/.test(l))) {
    throw new Error('merkleRootFromLeaves: each leaf must be 64 hex chars (SHA-256)');
  }
  let level: string[] = [...normalized];
  while (level.length > 1) {
    if (level.length % 2 !== 0) level.push(level[level.length - 1]);
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const combined = level[i] + level[i + 1];
      next.push(await sha256Hex(combined));
    }
    level = next;
  }
  return level[0];
}

/**
 * Produce the single sovereign root from the three pillar hashes using a Merkle tree.
 * Order: face_hash (leaf 0), palm_hash (leaf 1), identity_anchor_hash (leaf 2).
 * Same order as generateSovereignRoot for consistency.
 */
export async function generateMerkleRoot(
  faceHash: string,
  palmHash: string,
  identityAnchorHash: string
): Promise<string> {
  const f = String(faceHash).trim().toLowerCase();
  const p = String(palmHash).trim().toLowerCase();
  const i = String(identityAnchorHash).trim().toLowerCase();
  if (!f || !p || !i) throw new Error('generateMerkleRoot: face, palm, and identity anchor hashes are required');
  if (f.length !== HASH_HEX_LENGTH || p.length !== HASH_HEX_LENGTH || i.length !== HASH_HEX_LENGTH) {
    throw new Error('generateMerkleRoot: each hash must be 64 hex chars (SHA-256)');
  }
  return merkleRootFromLeaves([f, p, i]);
}

/**
 * Sovereign hash (Face + Device only): Merkle root of [FaceHash, DeviceHash].
 * Deterministic. No palm. Used for Face + Device Binding pipeline.
 */
export async function generateMerkleRootFaceDevice(faceHash: string, deviceHash: string): Promise<string> {
  const f = String(faceHash).trim().toLowerCase();
  const d = String(deviceHash).trim().toLowerCase();
  if (!f || !d) throw new Error('generateMerkleRootFaceDevice: face and device hashes are required');
  if (f.length !== HASH_HEX_LENGTH || d.length !== HASH_HEX_LENGTH) {
    throw new Error('generateMerkleRootFaceDevice: each hash must be 64 hex chars (SHA-256)');
  }
  return merkleRootFromLeaves([f, d]);
}
