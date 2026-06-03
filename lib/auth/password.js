import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password) {
  if (!password) return { valid: false, message: 'Password required' };
  if (password.length < 8) return { valid: false, message: 'Min 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Need uppercase' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Need number' };
  return { valid: true };
}
