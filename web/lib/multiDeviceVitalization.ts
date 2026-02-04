/**
 * MULTI-DEVICE VITALIZATION CONFIRMATION SYSTEM
 * Handles secondary device authorization via primary device
 * Architect: Isreal Okoro (mrfundzman)
 */

import { supabase } from './biometricAuth';

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'LAPTOP' | 'PHONE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN';
  deviceName: string;
  hardwareHash: string;
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
}

export interface VitalizationRequest {
  id: string;
  phone_number: string;
  device_id: string;
  device_type: string;
  device_name: string;
  hardware_hash: string;
  user_agent: string;
  ip_address: string;
  geolocation: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  } | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  requested_at: string;
  responded_at: string | null;
  primary_device_id: string | null;
}

/**
 * Get Current Device Information
 */
export function getCurrentDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect device type
  let deviceType: DeviceInfo['deviceType'] = 'UNKNOWN';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = 'TABLET';
    } else {
      deviceType = 'PHONE';
    }
  } else if (/Windows|Mac|Linux/i.test(platform)) {
    if (/Windows|Mac|Linux/i.test(userAgent) && !/Mobile/i.test(userAgent)) {
      deviceType = /Laptop|Notebook/i.test(userAgent) ? 'LAPTOP' : 'DESKTOP';
    }
  }

  // Generate device name
  let deviceName = 'Unknown Device';
  if (deviceType === 'LAPTOP') {
    if (/Windows/i.test(platform)) deviceName = 'Windows Laptop';
    else if (/Mac/i.test(platform)) deviceName = 'MacBook';
    else if (/Linux/i.test(platform)) deviceName = 'Linux Laptop';
  } else if (deviceType === 'DESKTOP') {
    if (/Windows/i.test(platform)) deviceName = 'Windows Desktop';
    else if (/Mac/i.test(platform)) deviceName = 'Mac Desktop';
    else if (/Linux/i.test(platform)) deviceName = 'Linux Desktop';
  } else if (deviceType === 'PHONE') {
    if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
    else if (/Android/i.test(userAgent)) deviceName = 'Android Phone';
  } else if (deviceType === 'TABLET') {
    if (/iPad/i.test(userAgent)) deviceName = 'iPad';
    else if (/Android/i.test(userAgent)) deviceName = 'Android Tablet';
  }

  // Get screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Generate device ID (stored in localStorage)
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `DEVICE-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    localStorage.setItem('device_id', deviceId);
  }

  // Generate hardware hash
  const hardwareHash = generateHardwareHash(userAgent, platform, screenResolution);

  return {
    deviceId,
    deviceType,
    deviceName,
    hardwareHash,
    userAgent,
    platform,
    screenResolution,
    timezone,
  };
}

/**
 * Generate Hardware Hash
 */
function generateHardwareHash(userAgent: string, platform: string, screenResolution: string): string {
  const data = `${userAgent}|${platform}|${screenResolution}`;
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Check if Device is Authorized
 */
export async function isDeviceAuthorized(phoneNumber: string, deviceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('authorized_devices')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('device_id', deviceId)
    .eq('status', 'ACTIVE')
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Get Primary Device for User
 */
export async function getPrimaryDevice(phoneNumber: string): Promise<{ device_id: string; device_name: string; last_4_digits: string } | null> {
  const { data, error } = await supabase
    .from('authorized_devices')
    .select('device_id, device_name, phone_number')
    .eq('phone_number', phoneNumber)
    .eq('is_primary', true)
    .eq('status', 'ACTIVE')
    .single();

  if (error || !data) {
    return null;
  }

  // Extract last 4 digits of phone number
  const last4 = phoneNumber.slice(-4);

  return {
    device_id: data.device_id,
    device_name: data.device_name,
    last_4_digits: last4,
  };
}

/**
 * Assign Primary Sentinel Device (First Device).
 * Uses compositeDeviceId (Canvas Fingerprint | Hardware UUID) when provided — this is the Device ID, not thumbprint.
 */
export async function assignPrimarySentinel(
  phoneNumber: string,
  fullName: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  geolocation: VitalizationRequest['geolocation'],
  compositeDeviceId?: string
): Promise<void> {
  const deviceIdToStore = compositeDeviceId ?? deviceInfo.deviceId;

  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (!existingProfile) {
    await supabase.from('user_profiles').insert({
      phone_number: phoneNumber,
      full_name: fullName,
      primary_sentinel_device_id: deviceIdToStore,
      primary_sentinel_assigned_at: new Date().toISOString(),
      guardian_recovery_enabled: false,
    });
  } else {
    await supabase
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: deviceIdToStore,
        primary_sentinel_assigned_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);
  }

  await supabase.from('authorized_devices').insert({
    phone_number: phoneNumber,
    device_id: deviceIdToStore,
    device_name: deviceInfo.deviceName,
    device_type: deviceInfo.deviceType,
    hardware_hash: deviceInfo.hardwareHash,
    is_primary: true,
    status: 'ACTIVE',
    authorized_at: new Date().toISOString(),
    authorized_by_device: 'FIRST_DEVICE',
    user_agent: deviceInfo.userAgent,
    platform: deviceInfo.platform,
    screen_resolution: deviceInfo.screenResolution,
    timezone: deviceInfo.timezone,
    ip_address: ipAddress,
    geolocation,
  });

  console.log('✅ Primary Sentinel Device assigned (Device ID):', deviceIdToStore.substring(0, 24) + '…');
}

/**
 * Create Vitalization Request.
 * When compositeDeviceId is provided (Canvas | UUID), store it as device_id so approval grants this device.
 */
export async function createVitalizationRequest(
  phoneNumber: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  geolocation: VitalizationRequest['geolocation'],
  compositeDeviceId?: string
): Promise<string> {
  const deviceIdToStore = compositeDeviceId ?? deviceInfo.deviceId;
  const { data, error } = await supabase
    .from('vitalization_requests')
    .insert({
      phone_number: phoneNumber,
      device_id: deviceIdToStore,
      device_type: deviceInfo.deviceType,
      device_name: deviceInfo.deviceName,
      hardware_hash: deviceInfo.hardwareHash,
      user_agent: deviceInfo.userAgent,
      ip_address: ipAddress,
      geolocation,
      status: 'PENDING',
      requested_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('Failed to create vitalization request');
  }

  return data.id;
}

/**
 * Subscribe to Vitalization Request Status
 */
export function subscribeToVitalizationRequest(
  requestId: string,
  onStatusChange: (status: 'APPROVED' | 'DENIED') => void
): () => void {
  const subscription = supabase
    .channel(`vitalization_request_${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vitalization_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        const newStatus = (payload.new as VitalizationRequest).status;
        if (newStatus === 'APPROVED' || newStatus === 'DENIED') {
          onStatusChange(newStatus);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Approve Vitalization Request
 */
export async function approveVitalizationRequest(requestId: string, primaryDeviceId: string): Promise<void> {
  // Update vitalization request status
  const { error: updateError } = await supabase
    .from('vitalization_requests')
    .update({
      status: 'APPROVED',
      responded_at: new Date().toISOString(),
      primary_device_id: primaryDeviceId,
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error('Failed to approve vitalization request');
  }

  // Get request details
  const { data: request, error: fetchError } = await supabase
    .from('vitalization_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('Failed to fetch vitalization request');
  }

  // Add device to authorized_devices
  const { error: insertError } = await supabase
    .from('authorized_devices')
    .insert({
      phone_number: request.phone_number,
      device_id: request.device_id,
      device_name: request.device_name,
      device_type: request.device_type,
      hardware_hash: request.hardware_hash,
      is_primary: false,
      status: 'ACTIVE',
      authorized_at: new Date().toISOString(),
      authorized_by_device: primaryDeviceId,
    });

  if (insertError) {
    throw new Error('Failed to authorize device');
  }
}

/**
 * Deny Vitalization Request
 */
export async function denyVitalizationRequest(requestId: string, primaryDeviceId: string): Promise<void> {
  const { error } = await supabase
    .from('vitalization_requests')
    .update({
      status: 'DENIED',
      responded_at: new Date().toISOString(),
      primary_device_id: primaryDeviceId,
    })
    .eq('id', requestId);

  if (error) {
    throw new Error('Failed to deny vitalization request');
  }
}

/**
 * Get All Authorized Devices for User
 */
export async function getAuthorizedDevices(phoneNumber: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('authorized_devices')
    .select('*')
    .eq('phone_number', phoneNumber)
    .order('authorized_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch authorized devices:', error);
    return [];
  }

  return data || [];
}

/**
 * Revoke Device Authorization
 */
export async function revokeDeviceAuthorization(deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('authorized_devices')
    .update({
      status: 'REVOKED',
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  if (error) {
    throw new Error('Failed to revoke device authorization');
  }

  console.log('✅ Device authorization revoked:', deviceId);
}

/**
 * Update Device Nickname
 */
export async function updateDeviceNickname(deviceId: string, nickname: string): Promise<void> {
  const { error } = await supabase
    .from('authorized_devices')
    .update({
      device_nickname: nickname,
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  if (error) {
    throw new Error('Failed to update device nickname');
  }

  console.log('✅ Device nickname updated:', deviceId, nickname);
}

/**
 * Update Last Used Timestamp
 */
export async function updateDeviceLastUsed(deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('authorized_devices')
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  if (error) {
    console.error('Failed to update device last used:', error);
  }
}

/**
 * Create Guardian Recovery Request
 */
export async function createGuardianRecoveryRequest(
  phoneNumber: string,
  oldPrimaryDeviceId: string | null,
  newDeviceInfo: DeviceInfo
): Promise<string> {
  const { data, error } = await supabase
    .from('guardian_recovery_requests')
    .insert({
      phone_number: phoneNumber,
      old_primary_device_id: oldPrimaryDeviceId,
      new_device_id: newDeviceInfo.deviceId,
      new_device_name: newDeviceInfo.deviceName,
      new_device_type: newDeviceInfo.deviceType,
      status: 'PENDING',
      required_approvals: 3,
      current_approvals: 0,
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('Failed to create guardian recovery request');
  }

  console.log('✅ Guardian recovery request created:', data.id);
  return data.id;
}

/**
 * Submit Guardian Approval
 */
export async function submitGuardianApproval(
  recoveryRequestId: string,
  guardianPhoneNumber: string,
  guardianFullName: string,
  biometricHash: string,
  faceScanVariance: number,
  ipAddress: string,
  geolocation: VitalizationRequest['geolocation']
): Promise<void> {
  const { error } = await supabase.from('guardian_approvals').insert({
    recovery_request_id: recoveryRequestId,
    guardian_phone_number: guardianPhoneNumber,
    guardian_full_name: guardianFullName,
    biometric_hash: biometricHash,
    face_scan_variance: faceScanVariance,
    approved_at: new Date().toISOString(),
    ip_address: ipAddress,
    geolocation,
  });

  if (error) {
    throw new Error('Failed to submit guardian approval');
  }

  console.log('✅ Guardian approval submitted:', guardianPhoneNumber);
}

/**
 * Get Guardian Recovery Request Status
 */
export async function getGuardianRecoveryStatus(requestId: string): Promise<any> {
  const { data, error } = await supabase
    .from('guardian_recovery_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Subscribe to Guardian Recovery Request
 */
export function subscribeToGuardianRecoveryRequest(
  requestId: string,
  onStatusChange: (status: 'APPROVED' | 'DENIED' | 'EXPIRED', currentApprovals: number) => void
): () => void {
  const subscription = supabase
    .channel(`guardian_recovery_${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'guardian_recovery_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        const newStatus = (payload.new as any).status;
        const currentApprovals = (payload.new as any).current_approvals;
        if (newStatus === 'APPROVED' || newStatus === 'DENIED' || newStatus === 'EXPIRED') {
          onStatusChange(newStatus, currentApprovals);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

