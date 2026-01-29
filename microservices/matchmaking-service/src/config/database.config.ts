// src/config/database.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  maxConnections: number;
  minConnections: number;
  acquireTimeout: number;
  timeout: number;
  idleTimeout: number;
  logging: boolean;
  logLevel: string;
}

export class DatabaseConfigService {
  private static instance: DatabaseConfigService;

  private constructor() {}

  public static getInstance(): DatabaseConfigService {
    if (!DatabaseConfigService.instance) {
      DatabaseConfigService.instance = new DatabaseConfigService();
    }
    return DatabaseConfigService.instance;
  }

  public getConfig(): DatabaseConfig {
    const isTest = process.env.NODE_ENV === 'test';

    return {
      host: isTest
        ? process.env.TEST_DB_HOST || 'localhost'
        : process.env.DB_HOST || 'localhost',
      port: isTest
        ? parseInt(process.env.TEST_DB_PORT || '5433')
        : parseInt(process.env.DB_PORT || '5432'),
      username: isTest
        ? process.env.TEST_DB_USER || 'postgres'
        : process.env.DB_USER || 'postgres',
      password: isTest
        ? process.env.TEST_DB_PASSWORD || 'password'
        : process.env.DB_PASSWORD || 'password',
      database: isTest
        ? process.env.TEST_DB_NAME || 'myapp_test'
        : process.env.DB_NAME || 'myapp',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '20000'),
      timeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '20000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      logging: process.env.DB_LOGGING === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
    };
  }

  public getTypeOrmConfig(): DataSourceOptions {
    const config = this.getConfig();

    return {
      type: 'postgres',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      entities: [path.join(__dirname, '../entities/*.{ts,js}')],
      migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
      subscribers: [path.join(__dirname, '../subscribers/*.{ts,js}')],
      synchronize: false,
      logging: config.logging
        ? ['query', 'error', 'schema', 'warn', 'info', 'log']
        : false,
      logger: 'advanced-console',
      maxQueryExecutionTime: 5000,
      poolSize: config.maxConnections,
      extra: {
        connectionTimeoutMillis: config.timeout,
        idleTimeoutMillis: config.idleTimeout,
        max: config.maxConnections,
        min: config.minConnections,
        acquireTimeoutMillis: config.acquireTimeout,
        createTimeoutMillis: 8000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      cache: {
        type: 'database',
        tableName: 'query_result_cache',
        duration: 30000,
      },
    };
  }
}
