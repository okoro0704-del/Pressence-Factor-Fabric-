/**
 * Run schema.sql against DATABASE_URL.
 * Usage: npx ts-node src/db/runSchema.ts
 */

import 'dotenv/config';
import { pool } from './client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
