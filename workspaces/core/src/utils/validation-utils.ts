/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate workspace name format
 */
export function isValidWorkspaceName(name: string): boolean {
  // Must start with letter, contain only lowercase letters, numbers, and hyphens
  return /^[a-z][a-z0-9-]*$/.test(name);
}

/**
 * Check if workspace name is reserved
 */
export function isReservedWorkspaceName(name: string): boolean {
  const reserved = ['core', 'scripts', 'node_modules', 'dist', 'build', 'public'];
  return reserved.includes(name);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate environment variable name
 */
export function isValidEnvVarName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

/**
 * Check if string contains sensitive information patterns
 */
export function containsSensitiveInfo(text: string): boolean {
  const sensitivePatterns = [
    /secret/i,
    /password/i,
    /token/i,
    /key/i,
    /private/i,
    /credential/i
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(text));
}