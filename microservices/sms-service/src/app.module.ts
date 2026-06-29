import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildDataSourceOptions } from './config/orm-config';
import smsConfig from './config/sms.config';
import { OtpModule } from './otp/otp.module';
import { ProvidersModule } from './providers/providers.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { SmsModule } from './sms/sms.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [smsConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        ({
          ...buildDataSourceOptions(),
          autoLoadEntities: true,
        }) as TypeOrmModuleOptions,
    }),
    ProvidersModule,
    TemplatesModule,
    ReceiptsModule,
    SmsModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
