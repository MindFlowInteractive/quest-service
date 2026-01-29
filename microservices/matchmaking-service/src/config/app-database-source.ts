import { DataSource } from 'typeorm';
import { DatabaseConfigService } from './database.config';

// Create DataSource instance lazily to avoid circular dependencies
let appDataSourceInstance: DataSource | null = null;

export const getAppDataSource = (): DataSource => {
  if (!appDataSourceInstance) {
    const configService = DatabaseConfigService.getInstance();
    appDataSourceInstance = new DataSource(configService.getTypeOrmConfig());
  }
  return appDataSourceInstance;
};

// For backward compatibility - only use this if you're not using DatabaseService
export const AppDataSource = getAppDataSource();
