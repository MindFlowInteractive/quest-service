import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',

    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT ?? 5432),

    username: process.env.DB_USERNAME,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_DATABASE,

    autoLoadEntities: true,

    synchronize: false,

    logging: process.env.NODE_ENV !== 'production',

    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,

    migrations: ['dist/database/migrations/*.js'],

    migrationsRun: false,

    entities: ['dist/**/*.entity.js'],

    extra: {
      max: Number(process.env.DB_POOL_SIZE ?? 20),

      min: Number(process.env.DB_POOL_MIN ?? 5),

      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT ?? 30000),

      connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT ?? 5000,
      ),
    },
  };
}
