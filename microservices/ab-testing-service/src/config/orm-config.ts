import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.AB_TESTING_DB_NAME || 'quest_ab_testing',
  schema: 'ab_testing',
  entities: ['dist/**/*.entity.js', 'src/**/*.entity.ts'],
  migrations: ['dist/database/migrations/*.js', 'src/database/migrations/*.ts'],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  migrationsRun: false,
});
