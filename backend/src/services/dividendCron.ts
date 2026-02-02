/**
 * PFF Backend — Monthly Truth Dividend Cron Job
 * Executes monthly dividend distribution on last day of month at 23:59 GMT
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Schedule monthly flush for last day of month at 23:59 GMT
 * - Execute dividend distribution to all verified truth-tellers
 * - Send notifications to recipients
 * - Log distribution to VLT
 */

import * as cron from 'node-cron';
import { executeMonthlyFlush } from './monthlyDividend';
import { sendDividendNotifications } from './dividendNotification';
import { executeArchitectShield } from './dividendProjectionOracle';
import { query } from '../db/client';

/**
 * Schedule monthly dividend distribution
 * Runs on last day of every month at 23:59 GMT
 * 
 * Cron expression: '59 23 L * *' (last day of month at 23:59)
 * Note: node-cron doesn't support 'L' for last day, so we use a workaround
 */
export function scheduleMonthlyDividend(): void {
  // Run at 23:59 GMT every day, but only execute on last day of month
  cron.schedule('59 23 * * *', async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if tomorrow is the first day of next month (meaning today is last day)
    if (tomorrow.getDate() === 1) {
      console.log(`[MONTHLY DIVIDEND] Executing monthly flush for ${now.toISOString().substring(0, 7)}`);

      try {
        // STEP 1: Execute Architect's Shield BEFORE monthly flush
        console.log('[MONTHLY DIVIDEND] Executing Architect Shield before flush');
        const shieldResult = await executeArchitectShield();

        if (!shieldResult.success) {
          console.error('[MONTHLY DIVIDEND] Architect Shield failed:', shieldResult.error);

          // Log failure to system events
          await query(
            `INSERT INTO system_events (event_type, event_data, created_at)
             VALUES ($1, $2, $3)`,
            [
              'ARCHITECT_SHIELD_FAILED',
              JSON.stringify({
                error: shieldResult.error,
                message: 'Architect Shield failed before monthly flush. Aborting dividend distribution.',
              }),
              new Date(),
            ]
          );

          return; // Abort monthly flush if Architect Shield fails
        }

        console.log('[MONTHLY DIVIDEND] Architect Shield complete. Proceeding with monthly flush.');
        console.log(`[MONTHLY DIVIDEND] Transferred ${shieldResult.transferredToArchitectVault} VIDA to architect vault`);

        // STEP 2: Execute monthly flush
        const result = await executeMonthlyFlush();

        if (result.success) {
          console.log(`[MONTHLY DIVIDEND] Distribution successful:`, {
            month: result.distributionMonth,
            totalBlockValue: result.totalBlockValue,
            totalTruthTellers: result.totalTruthTellers,
            sharePerCitizen: result.sharePerCitizen,
          });

          // Send notifications to all recipients
          await sendDividendNotifications(result.distributionMonth, result.sharePerCitizen);

          // Log to system events
          await query(
            `INSERT INTO system_events (event_type, event_data, created_at)
             VALUES ($1, $2, $3)`,
            [
              'MONTHLY_DIVIDEND_DISTRIBUTED',
              JSON.stringify({
                distributionMonth: result.distributionMonth,
                totalBlockValue: result.totalBlockValue,
                totalTruthTellers: result.totalTruthTellers,
                sharePerCitizen: result.sharePerCitizen,
                distributionHash: result.distributionHash,
                message: 'THE TRUTH HAS PAID. MONTHLY SOVEREIGN DIVIDEND DISTRIBUTED.',
              }),
              result.distributedAt,
            ]
          );
        } else {
          console.error(`[MONTHLY DIVIDEND] Distribution failed:`, result.error);

          // Log failure to system events
          await query(
            `INSERT INTO system_events (event_type, event_data, created_at)
             VALUES ($1, $2, $3)`,
            [
              'MONTHLY_DIVIDEND_FAILED',
              JSON.stringify({
                distributionMonth: result.distributionMonth,
                error: result.error,
              }),
              new Date(),
            ]
          );
        }
      } catch (e) {
        const err = e as Error;
        console.error(`[MONTHLY DIVIDEND] Unexpected error:`, err.message);

        // Log error to system events
        await query(
          `INSERT INTO system_events (event_type, event_data, created_at)
           VALUES ($1, $2, $3)`,
          [
            'MONTHLY_DIVIDEND_ERROR',
            JSON.stringify({
              error: err.message,
              stack: err.stack,
            }),
            new Date(),
          ]
        );
      }
    }
  }, {
    timezone: 'GMT'
  });

  console.log('[MONTHLY DIVIDEND] Cron job scheduled for last day of month at 23:59 GMT');
}

/**
 * Manually trigger monthly dividend distribution (for testing)
 * Includes Architect's Shield execution before flush
 */
export async function triggerManualDividendDistribution(): Promise<void> {
  console.log('[MONTHLY DIVIDEND] Manual trigger initiated');

  // STEP 1: Execute Architect's Shield BEFORE monthly flush
  console.log('[MONTHLY DIVIDEND] Executing Architect Shield before flush');
  const shieldResult = await executeArchitectShield();

  if (!shieldResult.success) {
    console.error('[MONTHLY DIVIDEND] Architect Shield failed:', shieldResult.error);
    console.error('[MONTHLY DIVIDEND] Aborting manual distribution');
    return;
  }

  console.log('[MONTHLY DIVIDEND] Architect Shield complete. Proceeding with monthly flush.');
  console.log(`[MONTHLY DIVIDEND] Transferred ${shieldResult.transferredToArchitectVault} VIDA to architect vault`);

  // STEP 2: Execute monthly flush
  const result = await executeMonthlyFlush();

  if (result.success) {
    console.log('[MONTHLY DIVIDEND] Manual distribution successful:', result);
    await sendDividendNotifications(result.distributionMonth, result.sharePerCitizen);
  } else {
    console.error('[MONTHLY DIVIDEND] Manual distribution failed:', result.error);
  }
}

