import { describe, it, expect } from 'vitest';

// Simple utility function for testing
function greet(name: string): string {
  return `Hello, ${name}!`;
}

describe('CLI Utils', () => {
  it('should greet users correctly', () => {
    expect(greet('World')).toBe('Hello, World!');
    expect(greet('CLI')).toBe('Hello, CLI!');
  });

  it('should handle empty strings', () => {
    expect(greet('')).toBe('Hello, !');
  });
});