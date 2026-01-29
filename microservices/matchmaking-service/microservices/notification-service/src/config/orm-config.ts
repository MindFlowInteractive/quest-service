import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the root of the microservice
dotenv.config({ path: path.join(__dirname, '../../.env') });

function mustGetEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return 'test';
    }
    // Don't throw here for CLI, just return empty and let TypeORM fail if needed
    return '';
  }
  return value;
}

console.log(`Connecting to database at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5433'} as user ${process.env.DB_USER || 'postgres'}`);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.NOTIFICATION_DB_NAME || 'notification_service',
  schema: 'notifications',
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../../database/migrations/*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  migrationsRun: false,
});
