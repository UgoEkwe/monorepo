/**
 * Utility functions for {{WORKSPACE_NAME}}
 */

import type { ExampleType, OperationResult, LibraryConfig } from '../types';

/**
 * Validates if the provided data matches ExampleType interface
 * @param data - Data to validate
 * @returns True if valid, false otherwise
 */
export function isValidExampleType(data: any): data is ExampleType {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.value === 'number' &&
    (data.optional === undefined || typeof data.optional === 'boolean') &&
    (data.createdAt === undefined || data.createdAt instanceof Date)
  );
}

/**
 * Creates a default ExampleType object
 * @param overrides - Properties to override
 * @returns Default ExampleType object
 */
export function createExampleType(overrides: Partial<ExampleType> = {}): ExampleType {
  return {
    id: generateId(),
    name: 'Example',
    value: 0,
    createdAt: new Date(),
    ...overrides
  };
}

/**
 * Generates a unique identifier
 * @returns Unique string identifier
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely parses JSON with error handling
 * @param jsonString - JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParse<T = any>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Creates a result object for operations
 * @param success - Whether the operation was successful
 * @param data - Result data
 * @param error - Error message if failed
 * @returns OperationResult object
 */
export function createResult<T>(
  success: boolean,
  data?: T,
  error?: string
): OperationResult<T> {
  return {
    success,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Merges library configurations with defaults
 * @param config - User configuration
 * @returns Merged configuration
 */
export function mergeConfig(config: Partial<LibraryConfig> = {}): LibraryConfig {
  const defaults: LibraryConfig = {
    debug: false,
    timeout: 5000,
    options: {}
  };
  
  return {
    ...defaults,
    ...config,
    options: {
      ...defaults.options,
      ...config.options
    }
  };
}

/**
 * Formats a number with specified decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}