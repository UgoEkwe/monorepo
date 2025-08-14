/**
 * {{WORKSPACE_NAME}} - {{DESCRIPTION}}
 * 
 * Main entry point for the library
 */

export * from './types';
export * from './utils';

/**
 * Example function that processes a string input
 * @param input - The input string to process
 * @returns The processed result
 */
export function exampleFunction(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  return `Processed: ${input}`;
}

/**
 * Example async function for demonstration
 * @param delay - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export async function exampleAsyncFunction(delay: number = 1000): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Async operation completed after ${delay}ms`);
    }, delay);
  });
}

/**
 * Library version and metadata
 */
export const libraryInfo = {
  name: '{{WORKSPACE_NAME}}',
  version: '{{VERSION}}',
  description: '{{DESCRIPTION}}'
} as const;