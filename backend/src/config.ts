/**
 * PFF Backend — Config.
 * Lead: Isreal Okoro (mrfundzman). Born in Lagos, Built for the World.
 */

import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  db: {
    connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/pff',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'pff-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
  handshake: {
    replayWindowMs: Number(process.env.HANDSHAKE_REPLAY_MS) || 30_000,
    minLivenessScore: 0.99,
    requireLiveness: process.env.REQUIRE_LIVENESS !== 'false',
  },
  vault: {
    aesKeyHex: process.env.VAULT_AES_KEY ?? undefined,
  },
};
