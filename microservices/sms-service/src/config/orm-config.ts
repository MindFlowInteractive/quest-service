import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const entityGlob = path.join(__dirname, '../**/*.entity.{ts,js}');

export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const type = env.DB_TYPE || 'postgres';

  if (type === 'sqljs') {
    return {
      type: 'sqljs',
      autoSave: false,
      location: env.DB_NAME || 'sms-service',
      entities: [entityGlob],
      synchronize: true,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: env.DB_HOST || '127.0.0.1',
    port: parseInt(env.DB_PORT || '5432', 10),
    username: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    database: env.DB_NAME || 'sms_service',
    entities: [entityGlob],
    synchronize: (env.DB_SYNC || 'true') === 'true',
    logging: env.NODE_ENV === 'development',
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions());
