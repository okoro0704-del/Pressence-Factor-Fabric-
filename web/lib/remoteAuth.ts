/**
 * REMOTE BIOMETRIC AUTHENTICATION
 * Phone-to-Laptop authentication bridge via Supabase real-time
 */

import { supabase } from './phoneIdentity';

export interface RemoteAuthSession {
  session_id: string;
  device_id: string;
  qr_code_data: string;
  status: 'pending' | 'scanning' | 'verified' | 'failed' | 'expired';
  created_at: string;
  expires_at: string;
  verified_at?: string;
  phone_device_id?: string;
  identity_hash?: string;
}

/**
 * Generate unique session ID for remote auth
 */
export function generateSessionId(): string {
  return `remote_auth_${Date.now()}_${crypto.randomUUID()}`;
}

/**
 * Create remote authentication session
 * Returns session data including QR code payload
 */
export async function createRemoteAuthSession(deviceId: string): Promise<RemoteAuthSession> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  // QR code data contains session ID and verification URL
  const qrCodeData = JSON.stringify({
    session_id: sessionId,
    device_id: deviceId,
    verify_url: `${window.location.origin}/verify-remote?session=${sessionId}`,
    expires_at: expiresAt.toISOString(),
  });
  
  const session: RemoteAuthSession = {
    session_id: sessionId,
    device_id: deviceId,
    qr_code_data: qrCodeData,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  
  // Store session in Supabase
  const { error } = await (supabase as any)
    .from('remote_auth_sessions')
    .insert(session);
  
  if (error) {
    console.error('Error creating remote auth session:', error);
    throw new Error('Failed to create remote auth session');
  }
  
  return session;
}

/**
 * Update remote auth session status
 */
export async function updateRemoteAuthSession(
  sessionId: string,
  updates: Partial<RemoteAuthSession>
): Promise<void> {
  const { error } = await (supabase as any)
    .from('remote_auth_sessions')
    .update(updates)
    .eq('session_id', sessionId);
  
  if (error) {
    console.error('Error updating remote auth session:', error);
    throw new Error('Failed to update remote auth session');
  }
}

/**
 * Get remote auth session by ID
 */
export async function getRemoteAuthSession(sessionId: string): Promise<RemoteAuthSession | null> {
  const { data, error } = await (supabase as any)
    .from('remote_auth_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (error) {
    console.error('Error fetching remote auth session:', error);
    return null;
  }
  
  return data as RemoteAuthSession;
}

/**
 * Listen for remote auth session updates (real-time)
 * Returns unsubscribe function
 */
export function subscribeToRemoteAuthSession(
  sessionId: string,
  onUpdate: (session: RemoteAuthSession) => void
): () => void {
  const client = supabase as any;
  const channel = client
    .channel(`remote_auth_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'remote_auth_sessions',
        filter: `session_id=eq.${sessionId}`,
      } as any,
      (payload: { new?: Record<string, unknown> } | undefined) => {
        const next = payload?.new;
        if (next) onUpdate(next as unknown as RemoteAuthSession);
      }
    );
  channel.subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}

/**
 * Verify remote auth session from phone
 * Called by mobile device after successful biometric scan
 */
export async function verifyRemoteAuthSession(
  sessionId: string,
  phoneDeviceId: string,
  identityHash: string
): Promise<boolean> {
  try {
    // Get session to verify it exists and is pending
    const session = await getRemoteAuthSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== 'pending' && session.status !== 'scanning') {
      throw new Error('Session is not in pending state');
    }
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      await updateRemoteAuthSession(sessionId, { status: 'expired' });
      throw new Error('Session has expired');
    }
    
    // Update session to verified
    await updateRemoteAuthSession(sessionId, {
      status: 'verified',
      verified_at: new Date().toISOString(),
      phone_device_id: phoneDeviceId,
      identity_hash: identityHash,
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying remote auth session:', error);
    await updateRemoteAuthSession(sessionId, { status: 'failed' });
    return false;
  }
}

/**
 * Check if session is verified
 */
export async function isSessionVerified(sessionId: string): Promise<boolean> {
  const session = await getRemoteAuthSession(sessionId);
  return session?.status === 'verified';
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const { error } = await (supabase as any)
    .from('remote_auth_sessions')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .in('status', ['pending', 'scanning']);
  
  if (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

