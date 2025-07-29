import { fsReadTool } from './fs_read';
import { fsWriteTool } from './fs_write';
import { dbQueryTool } from './db_query';
import { AgentTool } from '../types';

// Export all built-in tools
export const builtInTools: AgentTool[] = [
  fsReadTool,
  fsWriteTool,
  dbQueryTool
];

// Export individual tools
export { fsReadTool, fsWriteTool, dbQueryTool };

// Tool discovery function
export async function discoverTools(): Promise<AgentTool[]> {
  const tools: AgentTool[] = [...builtInTools];
  
  // TODO: Add dynamic tool discovery from files
  // This could scan the agent-tools directory for additional tool files
  // and automatically load them based on naming conventions
  
  return tools;
}