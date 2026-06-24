import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, key] = storedHash.split(':');
  if (scheme !== 'scrypt' || !salt || !key) return false;

  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = scryptSync(password, salt, keyBuffer.length);
  return timingSafeEqual(keyBuffer, derivedKey);
}
