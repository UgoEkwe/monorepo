/**
 * Type definitions for {{WORKSPACE_NAME}}
 */

/**
 * Example interface for demonstration
 */
export interface ExampleType {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Numeric value */
  value: number;
  /** Optional boolean flag */
  optional?: boolean;
  /** Creation timestamp */
  createdAt?: Date;
}

/**
 * Configuration options for the library
 */
export interface LibraryConfig {
  /** Enable debug mode */
  debug?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Custom options */
  options?: Record<string, any>;
}

/**
 * Result type for operations
 */
export interface OperationResult<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Event types for the library
 */
export type LibraryEvent = 
  | 'initialized'
  | 'processing'
  | 'completed'
  | 'error';

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: LibraryEvent, data?: T) => void;

/**
 * Utility type for making all properties optional
 */
export type PartialExampleType = Partial<ExampleType>;

/**
 * Utility type for making all properties required
 */
export type RequiredExampleType = Required<ExampleType>;