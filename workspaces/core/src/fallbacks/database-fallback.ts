/**
 * Fallback implementations for database workspace
 * Provides no-op implementations when database is not available
 */

export interface DatabaseFallback {
  prisma: PrismaFallback;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface PrismaFallback {
  user: TableFallback;
  project: TableFallback;
  entity: TableFallback;
  secret: TableFallback;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction<T>(fn: () => Promise<T>): Promise<T>;
}

export interface TableFallback {
  findMany(args?: any): Promise<any[]>;
  findUnique(args?: any): Promise<any | null>;
  findFirst(args?: any): Promise<any | null>;
  create(args?: any): Promise<any>;
  update(args?: any): Promise<any>;
  delete(args?: any): Promise<any>;
  upsert(args?: any): Promise<any>;
  count(args?: any): Promise<number>;
  aggregate(args?: any): Promise<any>;
  groupBy(args?: any): Promise<any[]>;
}

function createTableFallback(tableName: string): TableFallback {
  const logWarning = (operation: string) => {
    console.warn(`Database not available: ${tableName}.${operation}() called`);
  };

  return {
    async findMany() {
      logWarning('findMany');
      return [];
    },
    
    async findUnique() {
      logWarning('findUnique');
      return null;
    },
    
    async findFirst() {
      logWarning('findFirst');
      return null;
    },
    
    async create() {
      logWarning('create');
      throw new Error('Database not available - cannot create records');
    },
    
    async update() {
      logWarning('update');
      throw new Error('Database not available - cannot update records');
    },
    
    async delete() {
      logWarning('delete');
      throw new Error('Database not available - cannot delete records');
    },
    
    async upsert() {
      logWarning('upsert');
      throw new Error('Database not available - cannot upsert records');
    },
    
    async count() {
      logWarning('count');
      return 0;
    },
    
    async aggregate() {
      logWarning('aggregate');
      return {};
    },
    
    async groupBy() {
      logWarning('groupBy');
      return [];
    }
  };
}

export function createDatabaseFallback(): DatabaseFallback {
  const prismaFallback: PrismaFallback = {
    user: createTableFallback('user'),
    project: createTableFallback('project'),
    entity: createTableFallback('entity'),
    secret: createTableFallback('secret'),
    
    async $connect() {
      console.warn('Database not available - $connect() is no-op');
    },
    
    async $disconnect() {
      console.warn('Database not available - $disconnect() is no-op');
    },
    
    async $transaction<T>(fn: () => Promise<T>): Promise<T> {
      console.warn('Database not available - $transaction() executing without transaction');
      return await fn();
    }
  };

  return {
    prisma: prismaFallback,
    
    async connect() {
      console.warn('Database not available - connect() is no-op');
    },
    
    async disconnect() {
      console.warn('Database not available - disconnect() is no-op');
    }
  };
}