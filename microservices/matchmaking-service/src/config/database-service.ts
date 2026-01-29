// src/services/database.service.ts
import { DataSource, QueryRunner } from 'typeorm';
import { DatabaseConfigService } from '../config/database.config';

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  connection: boolean;
  latency: number;
  activeConnections: number;
  timestamp: Date;
  error?: string;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private dataSource: DataSource | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: DatabaseHealth | null = null;

  private constructor() {
    // Don't initialize dataSource in constructor to avoid circular dependency
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private getDataSourceInstance(): DataSource {
    if (!this.dataSource) {
      const configService = DatabaseConfigService.getInstance();
      this.dataSource = new DataSource(configService.getTypeOrmConfig());
    }
    return this.dataSource;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      const dataSource = this.getDataSourceInstance();

      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      console.log('Database connection initialized successfully');

      // Start health checks
      this.startHealthChecks();

      // Run pending migrations in production
      if (process.env.NODE_ENV === 'production') {
        await this.runMigrations();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public async runMigrations(): Promise<void> {
    try {
      console.log('Running database migrations...');
      const dataSource = this.getDataSourceInstance();
      await dataSource.runMigrations();
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public async revertMigration(): Promise<void> {
    try {
      console.log('Reverting last migration...');
      const dataSource = this.getDataSourceInstance();
      await dataSource.undoLastMigration();
      console.log('Migration reverted successfully');
    } catch (error) {
      console.error('Migration revert failed:', error);
      throw error;
    }
  }

  public async checkHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();

    try {
      const dataSource = this.getDataSourceInstance();

      // Test basic connection
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      // Test query execution
      const result = await queryRunner.query('SELECT 1 as test');

      // Get connection stats
      const stats = await this.getConnectionStats(queryRunner);

      await queryRunner.release();

      const latency = Date.now() - startTime;

      this.lastHealthCheck = {
        status: 'healthy',
        connection: true,
        latency,
        activeConnections: stats.activeConnections,
        timestamp: new Date(),
      };

      return this.lastHealthCheck;
    } catch (error) {
      this.lastHealthCheck = {
        status: 'unhealthy',
        connection: false,
        latency: Date.now() - startTime,
        activeConnections: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return this.lastHealthCheck;
    }
  }

  public async getConnectionStats(
    queryRunner?: QueryRunner,
  ): Promise<ConnectionStats> {
    const dataSource = this.getDataSourceInstance();
    const runner = queryRunner || dataSource.createQueryRunner();

    try {
      if (!queryRunner) await runner.connect();

      const result = await runner.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        totalConnections: parseInt(result[0].total_connections),
        activeConnections: parseInt(result[0].active_connections),
        idleConnections: parseInt(result[0].idle_connections),
        waitingConnections: parseInt(result[0].waiting_connections),
      };
    } finally {
      if (!queryRunner) await runner.release();
    }
  }

  public getLastHealthCheck(): DatabaseHealth | null {
    return this.lastHealthCheck;
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000); // Check every 30 seconds
  }

  public async retryConnection(
    maxRetries: number = 5,
    delay: number = 1000,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const dataSource = this.getDataSourceInstance();

        if (!dataSource.isInitialized) {
          await dataSource.initialize();
        }

        // Test connection
        await this.checkHealth();

        if (this.lastHealthCheck?.status === 'healthy') {
          console.log(`Connection retry successful on attempt ${attempt}`);
          return;
        }
      } catch (error) {
        console.log(`Connection attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to establish database connection after ${maxRetries} attempts`,
          );
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    const dataSource = this.getDataSourceInstance();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }

  public getDataSource(): DataSource {
    return this.getDataSourceInstance();
  }
}
