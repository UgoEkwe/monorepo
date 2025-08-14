import { describe, it, expect } from 'vitest';
import { exampleFunction, exampleAsyncFunction, libraryInfo } from './index';

describe('{{WORKSPACE_NAME}}', () => {
  describe('exampleFunction', () => {
    it('should process string input correctly', () => {
      const result = exampleFunction('hello');
      expect(result).toBe('Processed: hello');
    });

    it('should throw error for empty string', () => {
      expect(() => exampleFunction('')).toThrow('Input must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => exampleFunction(123 as any)).toThrow('Input must be a non-empty string');
    });
  });

  describe('exampleAsyncFunction', () => {
    it('should resolve after specified delay', async () => {
      const start = Date.now();
      const result = await exampleAsyncFunction(100);
      const elapsed = Date.now() - start;
      
      expect(result).toBe('Async operation completed after 100ms');
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });

    it('should use default delay when not specified', async () => {
      const result = await exampleAsyncFunction();
      expect(result).toBe('Async operation completed after 1000ms');
    });
  });

  describe('libraryInfo', () => {
    it('should contain correct metadata', () => {
      expect(libraryInfo.name).toBe('{{WORKSPACE_NAME}}');
      expect(libraryInfo.version).toBe('{{VERSION}}');
      expect(libraryInfo.description).toBe('{{DESCRIPTION}}');
    });
  });
});