/**
 * PFF Backend — Presence Factor Fabric API.
 * Lead: Isreal Okoro (mrfundzman). Born in Lagos, Built for the World.
 * 50/50 Doctrine. Presence Token on every protected API.
 */

import 'dotenv/config';
import express from 'express';
import { vitalizeRouter } from './routes/vitalize';
import { vaultRouter } from './routes/vault';
import { guardianRouter } from './routes/guardian';
import { economicRouter } from './routes/economic';
import { pillarsRouter } from './routes/pillars';
import { config } from './config';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pff-backend' });
});

app.use('/vitalize', vitalizeRouter);
app.use('/vault', vaultRouter);
app.use('/guardian', guardianRouter);
app.use('/economic', economicRouter);
app.use('/pillars', pillarsRouter);
// TODO: Add import { masterDashboardRouter } from './routes/masterDashboard'; at top
// app.use('/api/master-dashboard', masterDashboardRouter);

app.listen(config.port, () => {
  console.log(`PFF backend listening on ${config.port}`);
  // console.log('🏛️ Master Dashboard (Architect\'s Eye) routes registered at /api/master-dashboard');
});
