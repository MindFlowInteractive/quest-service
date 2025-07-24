import { DataSource, QueryRunner } from 'typeorm';

export interface QueryPerformanceMetrics {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
  rows: number;
}

export interface DatabaseMetrics {
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  performance: {
    slowQueries: QueryPerformanceMetrics[];
    cacheHitRatio: number;
    indexUsage: number;
  };
  storage: {
    databaseSize: string;
    tablesSizes: Array<{ table: string; size: string }>;
  };
}

export class PerformanceMonitoringService {
  constructor(private dataSource: DataSource) {}

  public async getSlowQueries(
    limit: number = 10,
  ): Promise<QueryPerformanceMetrics[]> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(
        `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          min_time,
          max_time,
          rows
        FROM pg_stat_statements 
        WHERE calls > 5
        ORDER BY mean_time DESC 
        LIMIT $1
      `,
        [limit],
      );

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  public async getCacheHitRatio(): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT 
          round(
            sum(blks_hit) * 100.0 / sum(blks_hit + blks_read), 2
          ) as cache_hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

      return result[0]?.cache_hit_ratio || 0;
    } finally {
      await queryRunner.release();
    }
  }

  public async getIndexUsage(): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT 
          round(
            sum(idx_scan) * 100.0 / sum(seq_scan + idx_scan), 2
          ) as index_usage_ratio
        FROM pg_stat_user_tables
        WHERE seq_scan + idx_scan > 0
      `);

      return result[0]?.index_usage_ratio || 0;
    } finally {
      await queryRunner.release();
    }
  }

  public async getDatabaseSize(): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      return result[0]?.size || '0 bytes';
    } finally {
      await queryRunner.release();
    }
  }

  public async getTablesSizes(): Promise<
    Array<{ table: string; size: string }>
  > {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT 
          schemaname||'.'||tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  public async getMetrics(): Promise<DatabaseMetrics> {
    const [slowQueries, cacheHitRatio, indexUsage, databaseSize, tablesSizes] =
      await Promise.all([
        this.getSlowQueries(),
        this.getCacheHitRatio(),
        this.getIndexUsage(),
        this.getDatabaseSize(),
        this.getTablesSizes(),
      ]);

    const connectionStats = await this.getConnectionStats();

    return {
      connections: connectionStats,
      performance: {
        slowQueries,
        cacheHitRatio,
        indexUsage,
      },
      storage: {
        databaseSize,
        tablesSizes,
      },
    };
  }

  private async getConnectionStats(): Promise<DatabaseMetrics['connections']> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        total: parseInt(result[0].total),
        active: parseInt(result[0].active),
        idle: parseInt(result[0].idle),
        waiting: parseInt(result[0].waiting),
      };
    } finally {
      await queryRunner.release();
    }
  }
}
