import { sha256 } from '@oslojs/crypto/sha2';
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from '@oslojs/encoding';

// This generates a random token for sessions
export const generateRandomToken = () => {
  const bytes = new Uint8Array(20); // Create 20 random bytes
  crypto.getRandomValues(bytes);
  // Convert to base32 string (URL-safe)
  return encodeBase32LowerCaseNoPadding(bytes);
};

// This hashes the token for secure storage
export const hashToken = (token: string) => {
  // Convert string to bytes, hash with SHA-256, then to hex
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
};
