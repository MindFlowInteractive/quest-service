import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Workflow],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Workflow]),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class AppModule {}