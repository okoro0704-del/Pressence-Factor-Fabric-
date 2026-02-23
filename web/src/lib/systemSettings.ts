/**
 * System settings — partner applications enabled flag (Master Switch).
 * MASTER_ARCHITECT can toggle via Command Center; submit flow checks this.
 */

/** Get whether new partner applications are accepted. Default true if unset. */
export async function getPartnerApplicationsEnabled(supabase: any): Promise<boolean> {
  if (!supabase?.from) return true;
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'partner_applications_enabled')
      .maybeSingle();
    if (error || !data?.value) return true;
    const v = data.value;
    if (typeof v === 'boolean') return v;
    if (v === true || v === 'true') return true;
    return false;
  } catch {
    return true;
  }
}

/** Set partner applications enabled (MASTER_ARCHITECT only; caller must enforce). */
export async function setPartnerApplicationsEnabled(
  supabase: any,
  enabled: boolean,
  updatedBy?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase?.from) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: 'partner_applications_enabled',
          value: enabled,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy ?? null,
        },
        { onConflict: 'key' }
      );
    if (error) return { ok: false, error: error.message ?? 'Update failed' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
