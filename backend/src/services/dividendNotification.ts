/**
 * PFF Backend — Monthly Truth Dividend Notification Service
 * Sends PFF protocol push notifications to dividend recipients
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Send push notification to all verified truth-tellers after dividend distribution
 * - Message: 'THE TRUTH HAS PAID. YOUR MONTHLY SOVEREIGN DIVIDEND HAS ARRIVED.'
 * - Include dividend amount in notification
 */

import { query } from '../db/client';

export interface DividendNotification {
  citizenId: string;
  pffId: string;
  dividendAmount: number;
  distributionMonth: string;
}

/**
 * Send dividend notification to a single citizen
 */
export async function sendDividendNotification(
  citizenId: string,
  pffId: string,
  dividendAmount: number,
  distributionMonth: string
): Promise<void> {
  // TODO: Integrate with actual push notification service (Firebase, OneSignal, etc.)
  // For now, we'll log to database as a notification record

  try {
    await query(
      `INSERT INTO notifications (citizen_id, notification_type, title, message, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        citizenId,
        'MONTHLY_DIVIDEND',
        'THE TRUTH HAS PAID',
        'YOUR MONTHLY SOVEREIGN DIVIDEND HAS ARRIVED.',
        JSON.stringify({
          pffId,
          dividendAmount,
          distributionMonth,
          formattedAmount: `${dividendAmount.toFixed(8)} VIDA`,
        }),
        new Date(),
      ]
    );

    console.log(`[DIVIDEND NOTIFICATION] Sent to ${pffId}: ${dividendAmount.toFixed(8)} VIDA`);
  } catch (e) {
    console.error(`[DIVIDEND NOTIFICATION] Failed to send notification to ${pffId}:`, e);
  }
}

/**
 * Send dividend notifications to all verified truth-tellers for a specific month
 */
export async function sendDividendNotifications(
  distributionMonth: string,
  sharePerCitizen: number
): Promise<void> {
  try {
    // Get all verified truth-tellers for the distribution month
    const result = await query<{ citizen_id: string; pff_id: string }>(
      `SELECT citizen_id, pff_id FROM verified_truth_tellers WHERE verified_month = $1`,
      [distributionMonth]
    );

    const truthTellers = result.rows;

    console.log(`[DIVIDEND NOTIFICATION] Sending notifications to ${truthTellers.length} truth-tellers`);

    // Send notification to each truth-teller
    for (const truthTeller of truthTellers) {
      await sendDividendNotification(
        truthTeller.citizen_id,
        truthTeller.pff_id,
        sharePerCitizen,
        distributionMonth
      );
    }

    console.log(`[DIVIDEND NOTIFICATION] All notifications sent successfully`);
  } catch (e) {
    console.error(`[DIVIDEND NOTIFICATION] Failed to send notifications:`, e);
    throw e;
  }
}

/**
 * Get dividend notification history for a citizen
 */
export async function getDividendNotificationHistory(citizenId: string): Promise<DividendNotification[]> {
  const result = await query<{
    citizen_id: string;
    pff_id: string;
    metadata: string;
  }>(
    `SELECT 
       n.citizen_id,
       c.pff_id,
       n.metadata
     FROM notifications n
     JOIN citizens c ON n.citizen_id = c.id
     WHERE n.citizen_id = $1 AND n.notification_type = 'MONTHLY_DIVIDEND'
     ORDER BY n.created_at DESC`,
    [citizenId]
  );

  return result.rows.map((row) => {
    const metadata = JSON.parse(row.metadata);
    return {
      citizenId: row.citizen_id,
      pffId: row.pff_id,
      dividendAmount: metadata.dividendAmount,
      distributionMonth: metadata.distributionMonth,
    };
  });
}

