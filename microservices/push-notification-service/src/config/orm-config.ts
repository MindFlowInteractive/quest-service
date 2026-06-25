import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the root of the microservice
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log(
  `Connecting to database at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5432'} as user ${process.env.DB_USER || 'postgres'}`,
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'push_notification_db',
  schema: process.env.DB_SCHEMA || undefined,
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../../database/migrations/*.{ts,js}')],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  migrationsRun: false,
});
