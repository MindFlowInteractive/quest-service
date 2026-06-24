import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersModule } from '../providers/providers.module';
import { TemplatesModule } from '../templates/templates.module';
import { Message } from './entities/message.entity';
import { Receipt } from './entities/receipt.entity';
import { Sms } from './entities/sms.entity';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sms, Message, Receipt]),
    ProvidersModule,
    TemplatesModule,
  ],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
