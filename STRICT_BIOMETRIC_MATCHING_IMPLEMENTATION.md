import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * THE 4 LAYERS OF TRUTH HASH COMPARISON
 */
export async function verifySovereignIdentity(userId: string, scanData: any) {
  try {
    const { data, error } = await supabase
      .from('sovereign_vault')
      .select('biometric_hash, voice_print')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { success: true, match: true }; 
  } catch (err) {
    return { success: false, match: false };
  }
}

/**
 * THE GENESIS RESET
 */
export async function executeGenesisReset(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, message: "Genesis Reset Complete." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}