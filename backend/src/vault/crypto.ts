/**
 * PFF Backend — AES-256-GCM field-level encryption for Living Record.
 */

import * as crypto from 'crypto';
import { config } from '../config';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const KEY_LEN = 32;

function getKey(): Buffer {
  const hex = config.vault.aesKeyHex;
  if (hex && hex.length === KEY_LEN * 2) {
    return Buffer.from(hex, 'hex');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VAULT_AES_KEY must be 64-char hex (32 bytes). Generate: openssl rand -hex 32');
  }
  return Buffer.alloc(KEY_LEN, 'pff-dev-vault-key-change-in-production');
}

export function encryptField(plain: string): { encrypted: string; iv: string; authTag: string } {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: enc.toString('base64'),
    iv: iv.toString('base64'),
    authTag: tag.toString('base64'),
  };
}

export function decryptField(encrypted: string, iv: string, authTag: string): string {
  const key = getKey();
  const ivBuf = Buffer.from(iv, 'base64');
  const tag = Buffer.from(authTag, 'base64');
  const decipher = crypto.createDecipheriv(ALG, key, ivBuf);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, 'base64', 'utf8') + decipher.final('utf8');
}
