/**
 * Client-Side Encryption Utilities
 * 
 * Uses Web Crypto API for AES-GCM encryption
 * Documents are encrypted in the browser before upload to Supabase Storage
 * Only the user (and authorized partners) can decrypt
 */

/**
 * Generate a random encryption key
 * Returns base64-encoded key for storage
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Encrypt a file using AES-GCM
 * Returns encrypted data as base64 string
 */
export async function encryptFile(
  file: File,
  encryptionKey: string
): Promise<{ encryptedData: string; iv: string }> {
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Import the encryption key
  const keyBuffer = base64ToArrayBuffer(encryptionKey);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the file
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt a file using AES-GCM
 * Returns decrypted data as Blob
 */
export async function decryptFile(
  encryptedData: string,
  iv: string,
  encryptionKey: string,
  mimeType: string = 'application/octet-stream'
): Promise<Blob> {
  // Import the encryption key
  const keyBuffer = base64ToArrayBuffer(encryptionKey);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: mimeType });
}

/**
 * Derive encryption key from user's phone number and a master secret
 * This allows consistent encryption/decryption across sessions
 */
export async function deriveEncryptionKey(
  phoneNumber: string,
  masterSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phoneNumber + masterSecret);

  // Hash the combined data
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return arrayBufferToBase64(hashBuffer);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get or create encryption key for a user
 * Stores in localStorage for persistence
 */
export async function getUserEncryptionKey(phoneNumber: string): Promise<string> {
  const storageKey = `pff_vault_key_${phoneNumber}`;
  
  // Try to get existing key
  let key = localStorage.getItem(storageKey);
  
  if (!key) {
    // Generate new key using phone number and a random master secret
    const masterSecret = crypto.getRandomValues(new Uint8Array(32)).toString();
    key = await deriveEncryptionKey(phoneNumber, masterSecret);
    localStorage.setItem(storageKey, key);
  }
  
  return key;
}

