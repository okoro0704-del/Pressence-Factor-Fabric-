/**
 * DEVICE DETECTION & BIOMETRIC CAPABILITY CHECK
 * Detects if device has compatible 3D camera for biometric authentication
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isDesktop: boolean;
  hasWebAuthn: boolean;
  has3DCamera: boolean;
  hasFaceID: boolean;
  hasTouchID: boolean;
  requiresRemoteAuth: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
}

/**
 * Detect if device has 3D camera capability
 * Checks for Windows Hello, Face ID, or compatible depth sensors
 */
async function detect3DCamera(): Promise<boolean> {
  try {
    // Check for WebAuthn platform authenticator (Face ID, Windows Hello, etc.)
    if (!window.PublicKeyCredential) return false;

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;

    // Additional check for specific biometric types
    const userAgent = navigator.userAgent.toLowerCase();
    
    // iOS devices with Face ID (iPhone X and later)
    if (/iphone|ipad/.test(userAgent)) {
      // Face ID available on iPhone X and later
      return true;
    }

    // macOS with Touch ID
    if (/macintosh/.test(userAgent)) {
      return true;
    }

    // Windows Hello (requires compatible camera)
    if (/windows/.test(userAgent)) {
      // Windows Hello is available, but we can't guarantee 3D camera
      // Return true if platform authenticator is available
      return available;
    }

    // Android devices with biometric support
    if (/android/.test(userAgent)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error detecting 3D camera:', error);
    return false;
  }
}

/**
 * Detect operating system
 */
function detectOS(): DeviceCapabilities['os'] {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/windows/.test(userAgent)) return 'windows';
  if (/macintosh|mac os x/.test(userAgent)) return 'macos';
  if (/linux/.test(userAgent)) return 'linux';
  
  return 'unknown';
}

/**
 * Detect device type
 */
function detectDeviceType(): DeviceCapabilities['deviceType'] {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Mobile detection
  if (/iphone|ipod|android.*mobile/.test(userAgent)) {
    return 'mobile';
  }
  
  // Tablet detection
  if (/ipad|android(?!.*mobile)/.test(userAgent)) {
    return 'tablet';
  }
  
  // Desktop by default
  return 'desktop';
}

/**
 * Get comprehensive device capabilities
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const deviceType = detectDeviceType();
  const os = detectOS();
  const isMobile = deviceType === 'mobile';
  const isDesktop = deviceType === 'desktop';
  
  // Check WebAuthn support
  const hasWebAuthn = !!window.PublicKeyCredential;
  
  // Check for 3D camera
  const has3DCamera = await detect3DCamera();
  
  // Face ID (iOS only)
  const hasFaceID = os === 'ios' && has3DCamera;
  
  // Touch ID (macOS/iOS)
  const hasTouchID = (os === 'macos' || os === 'ios') && has3DCamera;
  
  // Determine if remote authentication is required
  // Desktop without 3D camera needs remote auth
  const requiresRemoteAuth = isDesktop && !has3DCamera;
  
  return {
    isMobile,
    isDesktop,
    hasWebAuthn,
    has3DCamera,
    hasFaceID,
    hasTouchID,
    requiresRemoteAuth,
    deviceType,
    os,
  };
}

/**
 * Check if current device can perform local biometric authentication
 */
export async function canPerformLocalAuth(): Promise<boolean> {
  const capabilities = await getDeviceCapabilities();
  return capabilities.has3DCamera && capabilities.hasWebAuthn;
}

/**
 * Check if current device requires remote authentication
 */
export async function requiresRemoteAuth(): Promise<boolean> {
  const capabilities = await getDeviceCapabilities();
  return capabilities.requiresRemoteAuth;
}

/**
 * Get user-friendly device capability message
 */
export async function getCapabilityMessage(): Promise<string> {
  const capabilities = await getDeviceCapabilities();
  
  if (capabilities.requiresRemoteAuth) {
    return 'No compatible biometric sensor detected. Use your phone to authenticate.';
  }
  
  if (capabilities.hasFaceID) {
    return 'Face ID detected. Ready for biometric authentication.';
  }
  
  if (capabilities.hasTouchID) {
    return 'Touch ID detected. Ready for biometric authentication.';
  }
  
  if (capabilities.has3DCamera) {
    return 'Biometric sensor detected. Ready for authentication.';
  }
  
  return 'Biometric authentication not available on this device.';
}

