/**
 * Utilities for handling optional dependencies across workspaces
 * Provides safe imports and fallback mechanisms
 */

export interface OptionalDependency<T = any> {
  available: boolean;
  module: T | null;
  error?: Error;
}

/**
 * Safely import an optional dependency with fallback
 */
export function safeImport<T = any>(
  moduleName: string,
  fallback?: T
): OptionalDependency<T> {
  try {
    const module = require(moduleName);
    return {
      available: true,
      module: module.default || module,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Optional dependency '${moduleName}' not available:`, errorMessage);
    return {
      available: false,
      module: fallback || null,
      error: error as Error,
    };
  }
}

/**
 * Create a proxy that provides no-op implementations for missing dependencies
 */
export function createFallbackProxy<T extends object>(
  name: string,
  methods: (keyof T)[] = []
): T {
  const handler: ProxyHandler<T> = {
    get(_target, prop) {
      if (typeof prop === 'string' && methods.includes(prop as keyof T)) {
        return (..._args: any[]) => {
          console.warn(`${name}.${prop}() called but ${name} is not available`);
          return Promise.resolve(null);
        };
      }
      
      if (typeof prop === 'string') {
        console.warn(`${name}.${prop} accessed but ${name} is not available`);
        return undefined;
      }
      
      return undefined;
    },
    
    set(_target, prop, _value) {
      console.warn(`${name}.${String(prop)} set but ${name} is not available`);
      return true;
    }
  };
  
  return new Proxy({} as T, handler);
}

/**
 * Conditional feature wrapper
 */
export class FeatureWrapper<T> {
  private _available: boolean;
  private _module: T | null;
  private _fallback: T | null;
  
  constructor(
    private _moduleName: string,
    private _fallbackFactory?: () => T
  ) {
    const result = safeImport<T>(this._moduleName);
    this._available = result.available;
    this._module = result.module;
    this._fallback = this._fallbackFactory ? this._fallbackFactory() : null;
  }
  
  get available(): boolean {
    return this._available;
  }
  
  get module(): T | null {
    return this._module || this._fallback;
  }
  
  use<R>(callback: (module: T) => R, fallback?: R): R | undefined {
    if (this._available && this._module) {
      return callback(this._module);
    }
    
    if (this._fallback) {
      return callback(this._fallback);
    }
    
    return fallback;
  }
  
  async useAsync<R>(
    callback: (module: T) => Promise<R>,
    fallback?: R
  ): Promise<R | undefined> {
    if (this._available && this._module) {
      return await callback(this._module);
    }
    
    if (this._fallback) {
      return await callback(this._fallback);
    }
    
    return fallback;
  }
}

/**
 * Environment-based feature flags
 */
export class FeatureFlags {
  private static instance: FeatureFlags;
  private flags: Map<string, boolean> = new Map();
  
  private constructor() {
    this.loadFromEnvironment();
  }
  
  static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }
  
  private loadFromEnvironment() {
    // Load feature flags from environment variables
    const envVars = process.env;
    
    for (const [key, value] of Object.entries(envVars)) {
      if (key.startsWith('ENABLE_')) {
        const featureName = key.replace('ENABLE_', '').toLowerCase();
        this.flags.set(featureName, value?.toLowerCase() !== 'false');
      }
    }
  }
  
  isEnabled(feature: string): boolean {
    return this.flags.get(feature.toLowerCase()) ?? true;
  }
  
  setFlag(feature: string, enabled: boolean) {
    this.flags.set(feature.toLowerCase(), enabled);
  }
  
  getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }
}

// Export singleton instance
export const featureFlags = FeatureFlags.getInstance();