import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { MigrationModule } from './migration/migration.module';
import { Migration } from './migration/entities/migration.entity';
import { SchemaVersion } from './migration/entities/version.entity';
import { createLoggerConfig } from '../config/logger.config'; // Adjust path if needed
import { validateEnvironment } from '../config/env.validation'; // Adjust path if needed

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: ['.env.local', '.env'],
    }),

    // Logging (Winston) - matching main app
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => createLoggerConfig(configService),
      inject: [ConfigService],
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'quest_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),

    // Migration Feature Module
    MigrationModule,
  ],
})
export class AppModule {}