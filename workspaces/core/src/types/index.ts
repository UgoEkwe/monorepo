// Core workspace configuration types
export interface WorkspaceConfig {
  name: string;
  enabled: boolean;
  dependencies: string[];
  optionalDependencies: string[];
  buildOutputs: string[];
  devCommand: string;
  buildCommand: string;
}

export interface SharedConfig {
  database?: {
    enabled: boolean;
    url?: string;
  };
  supabase?: {
    enabled: boolean;
    url?: string;
    key?: string;
  };
  features: Record<string, boolean>;
}

// Database types (migrated from database workspace)
export interface User { 
  id: string; 
  email: string; 
  name?: string | null;
}

export interface Project { 
  id: string; 
  name: string; 
  ownerId: string; 
  slug?: string | null;
}

export interface Entity { 
  id: string; 
  name: string; 
  projectId: string; 
  status: string;
}

// Composite types
export type UserWithProjects = User & { projects: Project[] };
export type ProjectWithEntities = Project & { entities: Entity[] };
export type ProjectWithOwner = Project & { owner: User };
export type EntityWithProject = Entity & { project: Project };

// AI Agent types (migrated from ai workspace)
export interface AgentHooks {
  preChat?: (prompt: string) => Promise<string> | string;
  postChat?: (reply: string) => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any> | any;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[];
  hooks?: AgentHooks;
}

export interface AgentResult {
  response: string;
  toolCalls: Array<{
    name: string;
    parameters: any;
    result: any;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Payment types (migrated from payments workspace)
export interface CheckoutSessionConfig {
  entityId: string;
  entityName: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface EntityMetadataUpdate {
  entityId: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  subscriptionId?: string;
  customerId?: string;
}

// Workspace metadata types
export interface WorkspaceMetadata {
  name: string;
  type: 'web' | 'mobile' | 'backend' | 'service' | 'library';
  framework?: string;
  language: 'typescript' | 'javascript' | 'python';
  dependencies: {
    required: string[];
    optional: string[];
    peer: string[];
  };
  buildConfig: {
    outputs: string[];
    command: string;
    devCommand: string;
    testCommand?: string;
  };
  features: {
    database?: boolean;
    supabase?: boolean;
    tailwind?: boolean;
    [key: string]: boolean | undefined;
  };
}

// Cache types
export interface CacheEntry {
  key: string;
  workspace: string;
  timestamp: number;
  size: number;
  artifacts: string[];
  dependencies: Record<string, string>;
  nodeVersion?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}