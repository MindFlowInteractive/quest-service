import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, TicketMessage]),
    EventEmitterModule,
    NotificationsModule,
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportModule {}
