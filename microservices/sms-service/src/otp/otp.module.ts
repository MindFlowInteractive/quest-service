import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsModule } from '../sms/sms.module';
import { TemplatesModule } from '../templates/templates.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { OtpCode } from './entities/otp-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode]), SmsModule, TemplatesModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
