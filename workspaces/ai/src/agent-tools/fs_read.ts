import { promises as fs } from 'fs';
import { join } from 'path';
import { AgentTool } from '../types';

export const fsReadTool: AgentTool = {
  name: 'fs_read',
  description: 'Read the contents of a file from the file system',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to read (relative to project root)'
      }
    },
    required: ['path']
  },
  execute: async (args: { path: string }) => {
    try {
      // Ensure path is relative and safe
      const safePath = args.path.replace(/^\/+/, '').replace(/\.\.+/g, '');
      const fullPath = join(process.cwd(), safePath);
      
      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        success: true,
        content,
        path: safePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        path: args.path
      };
    }
  }
};