import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [],
  controllers: [VerificationController],
  providers: [VerificationService]
})
export class AppModule {}
