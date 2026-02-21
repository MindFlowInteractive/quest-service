import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { SocialAccount } from './entities/social-account.entity';
import { IntegrationSettings } from './entities/integration-settings.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { DiscordService } from './services/discord.service';
import { TwitterService } from './services/twitter.service';
import { IntegrationNotificationService } from './services/integration-notification.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SocialAccount, IntegrationSettings, WebhookEvent]),
    ],
    controllers: [IntegrationsController],
    providers: [DiscordService, TwitterService, IntegrationNotificationService],
    exports: [DiscordService, TwitterService, IntegrationNotificationService],
})
export class IntegrationsModule { }
