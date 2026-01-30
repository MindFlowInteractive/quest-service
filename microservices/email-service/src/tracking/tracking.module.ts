import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTrackingEvent } from './entities/email-tracking-event.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTrackingEvent]),
    forwardRef(() => EmailsModule),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
