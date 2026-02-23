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
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL ?? 'https://polygon-rpc.com',
    chainId: Number(process.env.POLYGON_CHAIN_ID) || 137,
    networkName: process.env.POLYGON_NETWORK_NAME ?? 'Polygon Mainnet',
    wsUrl: process.env.POLYGON_WS_URL ?? 'wss://polygon-bor-rpc.publicnode.com',
  },
  rsk: {
    rpcUrl: process.env.RSK_RPC_URL ?? 'https://public-node.rsk.co',
    chainId: Number(process.env.RSK_CHAIN_ID) || 30,
    networkName: process.env.RSK_NETWORK_NAME ?? 'Rootstock Mainnet',
    wsUrl: process.env.RSK_WS_URL ?? 'wss://public-node.rsk.co/websocket',
  },
  contracts: {
    polygon: {
      vidaCapToken: process.env.VIDA_CAP_TOKEN_ADDRESS ?? '',
      ngnVidaToken: process.env.NGN_VIDA_TOKEN_ADDRESS ?? '',
      sentinelVault: process.env.SENTINEL_VAULT_ADDRESS ?? '',
      nationalTreasury: process.env.NATIONAL_TREASURY_ADDRESS ?? '',
      foundationVault: process.env.FOUNDATION_VAULT_ADDRESS ?? '',
    },
    rsk: {
      dllr: process.env.DLLR_CONTRACT_ADDRESS ?? '',
      zusd: process.env.ZUSD_CONTRACT_ADDRESS ?? '',
      sovrynProtocol: process.env.SOVRYN_PROTOCOL_ADDRESS ?? '',
    },
  },
  economic: {
    citizenVaultVida: Number(process.env.CITIZEN_VAULT_VIDA) || 5.0,
    nationalTreasuryVida: Number(process.env.NATIONAL_TREASURY_VIDA) || 5.0,
    foundationVaultVida: Number(process.env.FOUNDATION_VAULT_VIDA) || 1.0,
    totalVidaPerVitalization: Number(process.env.TOTAL_VIDA_PER_VITALIZATION) || 11.0,
  },
};
