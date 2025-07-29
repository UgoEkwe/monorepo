import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { AgentTool } from '../types';

export const fsWriteTool: AgentTool = {
  name: 'fs_write',
  description: 'Write content to a file in the file system',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to write to (relative to project root)'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      },
      createDirs: {
        type: 'boolean',
        description: 'Whether to create parent directories if they don\'t exist',
        default: true
      }
    },
    required: ['path', 'content']
  },
  execute: async (args: { path: string; content: string; createDirs?: boolean }) => {
    try {
      // Ensure path is relative and safe
      const safePath = args.path.replace(/^\/+/, '').replace(/\.\.+/g, '');
      const fullPath = join(process.cwd(), safePath);
      
      // Create parent directories if needed
      if (args.createDirs !== false) {
        await fs.mkdir(dirname(fullPath), { recursive: true });
      }
      
      await fs.writeFile(fullPath, args.content, 'utf-8');
      
      return {
        success: true,
        path: safePath,
        bytesWritten: Buffer.byteLength(args.content, 'utf-8')
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