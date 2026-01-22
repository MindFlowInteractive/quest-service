import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { TemplatesModule } from '../templates/templates.module';
import { QueueModule } from '../queue/queue.module';
import { UserPreference } from '../preferences/entities/preference.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, UserPreference]),
        TemplatesModule,
        QueueModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
