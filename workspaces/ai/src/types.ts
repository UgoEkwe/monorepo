export interface AgentHooks {
  preChat?: (prompt: string) => Promise<string> | string;
  postChat?: (reply: string) => Promise<void> | void;
  preToolCall?: (tool: string, args: any) => Promise<any> | any;
  postToolCall?: (tool: string, result: any) => Promise<void> | void;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<any>;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  hooks?: AgentHooks;
  tools?: AgentTool[];
}

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type ChatMessage = ChatCompletionMessageParam;

export interface AgentResult {
  response: string;
  toolCalls: Array<{
    tool: string;
    args: any;
    result: any;
  }>;
  metadata?: Record<string, any>;
}