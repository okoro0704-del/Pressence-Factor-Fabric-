/**
 * @file Guardian Encryption Utilities
 * @description Client-side encryption using Web Crypto API for credential protection
 * CRITICAL: All credentials are encrypted on the client before transmission
 */

/**
 * Encrypted credential payload
 */
export interface EncryptedCredential {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  timestamp: number;
}

/**
 * Credential data structure
 */
export interface CredentialData {
  serviceId: string;
  credentialType: "api_key" | "login" | "account_id";
  credentials: {
    [key: string]: string; // e.g., { apiKey: "...", apiSecret: "..." }
  };
}

/**
 * Generate encryption key from user's master password
 * Uses PBKDF2 for key derivation
 */
async function deriveEncryptionKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt credential data using AES-GCM
 * @param data Credential data to encrypt
 * @param masterPassword User's PFF master password
 * @returns Encrypted credential payload
 */
export async function encryptCredentials(
  data: CredentialData,
  masterPassword: string
): Promise<EncryptedCredential> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive encryption key
    const key = await deriveEncryptionKey(masterPassword, salt);
    
    // Convert data to JSON and encode
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Encrypt using AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataBuffer
    );
    
    // Convert to base64 for transmission
    return {
      encryptedData: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[ENCRYPTION ERROR]", error);
    throw new Error("Failed to encrypt credentials");
  }
}

/**
 * Decrypt credential data (for verification only - should be done server-side)
 * @param encrypted Encrypted credential payload
 * @param masterPassword User's PFF master password
 * @returns Decrypted credential data
 */
export async function decryptCredentials(
  encrypted: EncryptedCredential,
  masterPassword: string
): Promise<CredentialData> {
  try {
    // Convert base64 to buffers
    const encryptedBuffer = base64ToArrayBuffer(encrypted.encryptedData);
    const iv = base64ToArrayBuffer(encrypted.iv);
    const salt = base64ToArrayBuffer(encrypted.salt);
    
    // Derive encryption key
    const key = await deriveEncryptionKey(masterPassword, new Uint8Array(salt));
    
    // Decrypt using AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      encryptedBuffer
    );
    
    // Convert to JSON
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("[DECRYPTION ERROR]", error);
    throw new Error("Failed to decrypt credentials - invalid password or corrupted data");
  }
}

/**
 * Mask sensitive data for display
 * @param value Sensitive value to mask
 * @param visibleChars Number of characters to show at the end
 * @returns Masked string (e.g., "**** 4321")
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return "*".repeat(value?.length || 4);
  }
  
  const masked = "*".repeat(Math.max(4, value.length - visibleChars));
  const visible = value.slice(-visibleChars);
  
  return `${masked} ${visible}`;
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

