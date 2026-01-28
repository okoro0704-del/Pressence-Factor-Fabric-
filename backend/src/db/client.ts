/**
 * PFF Backend — DB client (50/50).
 */

import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool(config.db);

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  try {
    const r = await client.query(text, params);
    return { rows: (r.rows as T[]), rowCount: r.rowCount ?? 0 };
  } finally {
    client.release();
  }
}
