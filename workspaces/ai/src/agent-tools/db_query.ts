import { prisma } from '../database';
import { AgentTool } from '../types';

export const dbQueryTool: AgentTool = {
  name: 'db_query',
  description: 'Query the database for entities, projects, or users',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['findMany', 'findUnique', 'create', 'update', 'delete'],
        description: 'The database operation to perform'
      },
      model: {
        type: 'string',
        enum: ['user', 'project', 'entity'],
        description: 'The model to query'
      },
      data: {
        type: 'object',
        description: 'Data for create/update operations'
      },
      where: {
        type: 'object',
        description: 'Where clause for filtering'
      },
      include: {
        type: 'object',
        description: 'Relations to include in the result'
      },
      take: {
        type: 'number',
        description: 'Limit the number of results'
      },
      skip: {
        type: 'number',
        description: 'Skip a number of results'
      }
    },
    required: ['operation', 'model']
  },
  execute: async (args: {
    operation: 'findMany' | 'findUnique' | 'create' | 'update' | 'delete';
    model: 'user' | 'project' | 'entity';
    data?: any;
    where?: any;
    include?: any;
    take?: number;
    skip?: number;
  }) => {
    try {
      const { operation, model, data, where, include, take, skip } = args;
      
      // Get the appropriate Prisma model
      const prismaModel = prisma[model as keyof typeof prisma] as any;
      
      if (!prismaModel) {
        throw new Error(`Invalid model: ${model}`);
      }
      
      let result;
      
      switch (operation) {
        case 'findMany':
          result = await prismaModel.findMany({
            where,
            include,
            take,
            skip
          });
          break;
          
        case 'findUnique':
          result = await prismaModel.findUnique({
            where,
            include
          });
          break;
          
        case 'create':
          if (!data) {
            throw new Error('Data is required for create operation');
          }
          result = await prismaModel.create({
            data,
            include
          });
          break;
          
        case 'update':
          if (!data) {
            throw new Error('Data is required for update operation');
          }
          result = await prismaModel.update({
            where,
            data,
            include
          });
          break;
          
        case 'delete':
          result = await prismaModel.delete({
            where
          });
          break;
          
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
      
      return {
        success: true,
        result,
        operation,
        model
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: args.operation,
        model: args.model
      };
    }
  }
};