export function getRequiredEnv(key, options = {}) {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}${options.hint ? ` (${options.hint})` : ''}`);
  }
  return value;
}

export function getRequiredEnvString(key, options = {}) {
  return String(getRequiredEnv(key, options));
}

export function getRequiredSecret(key, options = {}) {
  const value = getRequiredEnv(key, options);
  if (value.length < (options.minLength || 32)) {
    throw new Error(`Environment variable ${key} must be at least ${options.minLength || 32} characters`);
  }
  return value;
}

export function validateRequiredEnvs(keys = []) {
  const missing = keys.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

export function validateOptionalEnvs(keys = []) {
  const missing = keys.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    console.warn(`[env] Optional environment variables not set: ${missing.join(', ')} (this may disable optional features)`);
  }
  return missing.length === 0;
}

export function getOptionalEnv(key) {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : undefined;
}
