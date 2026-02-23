/**
 * AUTO-PROMOTION SYSTEM
 * Automatically promotes dependents to sovereign status when they turn 18
 * Triggers "Sovereign Awakening" notification and 4-layer master scan
 */

import { supabase } from './phoneIdentity';
import { calculateAge } from './phoneIdentity';

export interface AutoPromotionCandidate {
  phone_number: string;
  full_name: string;
  date_of_birth: string;
  age_years: number;
  guardian_phone: string;
  vida_balance: number;
  spendable_vida: number;
  locked_vida: number;
}

export interface AutoPromotionQueueItem {
  id: string;
  dependent_phone: string;
  dependent_name: string;
  date_of_birth: string;
  age_years: number;
  guardian_phone: string;
  status: 'PENDING' | 'NOTIFIED' | 'COMPLETED' | 'DECLINED';
  notified_at?: string;
  completed_at?: string;
  created_at: string;
}

/**
 * Check for dependents eligible for auto-promotion (age >= 18)
 * This should be run daily via cron job or background worker
 */
export async function checkAutoPromotionEligibility(): Promise<AutoPromotionCandidate[]> {
  try {
    console.log('🔍 Checking for auto-promotion eligible dependents...');

    // Query all active dependents
    const { data: dependents, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('account_type', 'DEPENDENT')
      .eq('status', 'ACTIVE')
      .is('promoted_at', null); // Not already promoted

    if (error) {
      console.error('Error querying dependents:', error);
      return [];
    }

    if (!dependents || dependents.length === 0) {
      console.log('No active dependents found');
      return [];
    }

    const eligibleCandidates: AutoPromotionCandidate[] = [];

    for (const dependent of dependents) {
      const age = calculateAge(dependent.date_of_birth);

      if (age >= 18) {
        console.log(`✅ Eligible: ${dependent.full_name} (${age} years old)`);

        eligibleCandidates.push({
          phone_number: dependent.phone_number,
          full_name: dependent.full_name,
          date_of_birth: dependent.date_of_birth,
          age_years: age,
          guardian_phone: dependent.guardian_phone,
          vida_balance: parseFloat(dependent.vida_balance || '0'),
          spendable_vida: parseFloat(dependent.spendable_vida || '0'),
          locked_vida: parseFloat(dependent.locked_vida || '0'),
        });

        // Add to auto_promotion_queue if not already there
        const { data: existing } = await supabase
          .from('auto_promotion_queue')
          .select('id')
          .eq('dependent_phone', dependent.phone_number)
          .eq('status', 'PENDING')
          .single();

        if (!existing) {
          await supabase.from('auto_promotion_queue').insert({
            dependent_phone: dependent.phone_number,
            dependent_name: dependent.full_name,
            date_of_birth: dependent.date_of_birth,
            age_years: age,
            guardian_phone: dependent.guardian_phone,
            status: 'PENDING',
          });

          console.log(`📋 Added to promotion queue: ${dependent.full_name}`);
        }
      }
    }

    console.log(`🎯 Found ${eligibleCandidates.length} eligible candidates for auto-promotion`);
    return eligibleCandidates;
  } catch (error) {
    console.error('Error checking auto-promotion eligibility:', error);
    return [];
  }
}

/**
 * Get pending auto-promotion requests for a specific user
 */
export async function getPendingPromotions(phoneNumber: string): Promise<AutoPromotionQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('auto_promotion_queue')
      .select('*')
      .eq('dependent_phone', phoneNumber)
      .in('status', ['PENDING', 'NOTIFIED'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending promotions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting pending promotions:', error);
    return [];
  }
}

/**
 * Mark promotion as notified (user has seen the Sovereign Awakening notification)
 */
export async function markPromotionNotified(queueId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auto_promotion_queue')
      .update({
        status: 'NOTIFIED',
        notified_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    if (error) {
      console.error('Error marking promotion as notified:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating promotion status:', error);
    return false;
  }
}

/**
 * Complete auto-promotion after successful 4-layer scan
 * Updates account_type from DEPENDENT to PROMOTED_SOVEREIGN
 */
export async function completeAutoPromotion(
  phoneNumber: string,
  queueId: string
): Promise<boolean> {
  try {
    console.log(`🎉 Completing auto-promotion for ${phoneNumber}...`);

    // Update family_members table
    const { error: updateError } = await supabase
      .from('family_members')
      .update({
        account_type: 'PROMOTED_SOVEREIGN',
        promoted_at: new Date().toISOString(),
        promotion_triggered_by: 'AUTO_AGE_18',
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);

    if (updateError) {
      console.error('Error updating family member:', updateError);
      return false;
    }

    // Update auto_promotion_queue
    const { error: queueError } = await supabase
      .from('auto_promotion_queue')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    if (queueError) {
      console.error('Error updating promotion queue:', queueError);
      return false;
    }

    console.log(`✅ Auto-promotion completed for ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error completing auto-promotion:', error);
    return false;
  }
}

/**
 * Decline auto-promotion (user chooses to remain dependent)
 */
export async function declineAutoPromotion(queueId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auto_promotion_queue')
      .update({
        status: 'DECLINED',
      })
      .eq('id', queueId);

    if (error) {
      console.error('Error declining promotion:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating promotion status:', error);
    return false;
  }
}

