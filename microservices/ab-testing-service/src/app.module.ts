import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentModule } from './experiment/experiment.module';
import { AppDataSource } from './config/orm-config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: AppDataSource.options.type as any,
      host: AppDataSource.options.host,
      port: AppDataSource.options.port,
      username: AppDataSource.options.username,
      password: AppDataSource.options.password,
      database: AppDataSource.options.database,
      schema: AppDataSource.options.schema,
      entities: AppDataSource.options.entities,
      synchronize: AppDataSource.options.synchronize,
      logging: AppDataSource.options.logging,
    }),
    ExperimentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
