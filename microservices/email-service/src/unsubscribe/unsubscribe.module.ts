import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailUnsubscribe } from './entities/email-unsubscribe.entity';
import { UnsubscribeService } from './unsubscribe.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailUnsubscribe])],
  controllers: [UnsubscribeController],
  providers: [UnsubscribeService],
  exports: [UnsubscribeService],
})
export class UnsubscribeModule {}
