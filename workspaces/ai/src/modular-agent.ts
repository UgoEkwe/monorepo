import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AgentTool, AgentHooks, AgentConfig, AgentResult } from './types';
import { discoverTools } from './agent-tools';

export class ModularAgent {
  private client: OpenAI;
  private tools: Map<string, AgentTool> = new Map();
  private hooks: AgentHooks = {};
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = {
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      ...config
    };

    // Initialize OpenAI client with OpenRouter
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    this.hooks = config.hooks || {};
  }

  async initialize(): Promise<void> {
    await this.loadTools();
  }

  private async loadTools(): Promise<void> {
    // Load built-in tools
    const discoveredTools = await discoverTools();

    // Add any custom tools from config
    const allTools = [...discoveredTools, ...(this.config.tools || [])];

    // Register all tools
    for (const tool of allTools) {
      this.tools.set(tool.name, tool);
    }
  }

  async runLoop(prompt: string, projectId?: string): Promise<AgentResult> {
    try {
      // Apply pre-chat hook
      let processedPrompt = prompt;
      if (this.hooks.preChat) {
        processedPrompt = await this.hooks.preChat(prompt);
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a helpful AI assistant with access to tools. You can read and write files, query databases, and perform various tasks. Always be helpful and accurate.${projectId ? ` You are working within project ID: ${projectId}` : ''}`
        },
        {
          role: 'user',
          content: processedPrompt
        }
      ];

      const toolCalls: Array<{ tool: string; args: any; result: any }> = [];
      let response = '';

      // Convert tools to OpenAI format
      const openaiTools = Array.from(this.tools.values()).map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }));

      // Make the initial API call
      const completion = await this.client.chat.completions.create({
        model: this.config.model!,
        messages,
        tools: openaiTools.length > 0 ? openaiTools : undefined,
        tool_choice: 'auto',
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from AI model');
      }

      // Handle tool calls if present
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls
        });

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const tool = this.tools.get(toolName);

          if (!tool) {
            const errorResult = { error: `Tool ${toolName} not found` };
            toolCalls.push({ tool: toolName, args: {}, result: errorResult });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(errorResult)
            });
            continue;
          }

          try {
            // Parse tool arguments
            const args = JSON.parse(toolCall.function.arguments);

            // Apply pre-tool hook
            let processedArgs = args;
            if (this.hooks.preToolCall) {
              processedArgs = await this.hooks.preToolCall(toolName, args);
            }

            // Execute the tool
            const result = await tool.execute(processedArgs);
            toolCalls.push({ tool: toolName, args: processedArgs, result });

            // Apply post-tool hook
            if (this.hooks.postToolCall) {
              await this.hooks.postToolCall(toolName, result);
            }

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });

          } catch (error) {
            const errorResult = {
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            toolCalls.push({ tool: toolName, args: {}, result: errorResult });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(errorResult)
            });
          }
        }

        // Get final response after tool execution
        const finalCompletion = await this.client.chat.completions.create({
          model: this.config.model!,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        });

        response = finalCompletion.choices[0]?.message?.content || '';
      } else {
        response = assistantMessage.content || '';
      }

      // Apply post-chat hook
      if (this.hooks.postChat) {
        await this.hooks.postChat(response);
      }

      return {
        response,
        toolCalls,
        metadata: {
          model: this.config.model,
          projectId
        }
      };

    } catch (error) {
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    // Apply pre-tool hook
    let processedArgs = args;
    if (this.hooks.preToolCall) {
      processedArgs = await this.hooks.preToolCall(toolName, args);
    }

    // Execute the tool
    const result = await tool.execute(processedArgs);

    // Apply post-tool hook
    if (this.hooks.postToolCall) {
      await this.hooks.postToolCall(toolName, result);
    }

    return result;
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  addTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  removeTool(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  setHooks(hooks: AgentHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }
}