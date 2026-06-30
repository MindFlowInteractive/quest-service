import { Body, Controller, Post } from '@nestjs/common';
import { SendOtpDto, VerifyOtpDto } from './dto';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  send(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}
