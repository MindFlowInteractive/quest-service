import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LicenseModule } from './license/license.module';
import { ActivationModule } from './activation/activation.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'license_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    LicenseModule,
    ActivationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

