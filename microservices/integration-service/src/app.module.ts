import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Integration } from './entities';
import { Connection } from './entities';
import { Webhook } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'integration_db',
      synchronize: (process.env.DB_SYNC || 'true') === 'true',
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([Integration, Connection, Webhook]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
