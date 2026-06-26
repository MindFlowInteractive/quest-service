import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationModule } from './migration/migration.module';
import { MigrationEntity } from './migration/entities/migration.entity';
import { VersionEntity } from './migration/entities/version.entity';
import { RollbackEntity } from './migration/entities/rollback.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'migration_db',
      entities: [MigrationEntity, VersionEntity, RollbackEntity],
      synchronize: true, // Only for demo; in production use proper migrations for the migration DB itself
    }),
    MigrationModule,
  ],
})
export class AppModule {}
