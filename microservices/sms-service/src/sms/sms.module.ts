import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersModule } from '../providers/providers.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { TemplatesModule } from '../templates/templates.module';
import { SmsMessage } from './entities/sms-message.entity';
import { PhoneNumberService } from './phone-number.service';
import { SmsController } from './sms.controller';
import { SmsDispatcherService } from './sms-dispatcher.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsMessage]),
    ProvidersModule,
    ReceiptsModule,
    TemplatesModule,
  ],
  controllers: [SmsController],
  providers: [PhoneNumberService, SmsDispatcherService, SmsService],
  exports: [PhoneNumberService, SmsService],
})
export class SmsModule {}
