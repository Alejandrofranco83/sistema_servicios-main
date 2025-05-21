declare module 'mysql2/promise' {
  export interface PoolOptions {
    host?: string;
    user?: string;
    password?: string;
    database?: string;
    waitForConnections?: boolean;
    connectionLimit?: number;
    queueLimit?: number;
    port?: number;
    ssl?: any;
  }

  export interface PoolConnection {
    query(sql: string, values?: any[]): Promise<any[]>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
  }

  export interface Pool {
    getConnection(): Promise<PoolConnection>;
    query(sql: string, values?: any[]): Promise<any[]>;
    end(): Promise<void>;
  }

  export function createPool(options: PoolOptions): Pool;
} 