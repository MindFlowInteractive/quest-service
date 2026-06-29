import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const entityGlob = path.join(__dirname, '../**/*.entity.{ts,js}');

export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
  includeEntityGlob = false,
): DataSourceOptions {
  const type = env.DB_TYPE || 'postgres';
  const common = includeEntityGlob ? { entities: [entityGlob] } : {};

  if (type === 'sqljs') {
    return {
      type: 'sqljs',
      autoSave: false,
      location: env.DB_NAME || 'sms-service',
      synchronize: true,
      logging: false,
      ...common,
    };
  }

  return {
    type: 'postgres',
    host: env.DB_HOST || '127.0.0.1',
    port: parseInt(env.DB_PORT || '5432', 10),
    username: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    database: env.DB_NAME || 'sms_service',
    synchronize: (env.DB_SYNC || 'true') === 'true',
    logging: env.NODE_ENV === 'development',
    ...common,
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions(process.env, true));
