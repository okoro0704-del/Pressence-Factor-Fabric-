/**
 * Sovereign Heartbeat — Edge Function.
 * Served from the data center closest to the user (Lagos, London, New York, etc.)
 * for millisecond latency. The Companion can call GET /api/sovereign-edge to
 * confirm it is speaking from the nearest VLT.
 */
import type { Config } from '@netlify/edge-functions';

export const config: Config = {
  path: '/api/sovereign-edge',
};

export default async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      vlt: 'sovereign',
      message: 'The pulse is near. I speak from the edge.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
};
