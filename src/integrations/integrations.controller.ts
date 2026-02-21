import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Headers,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationSettings } from './entities/integration-settings.entity';
import { SocialAccount, SocialProvider } from './entities/social-account.entity';
import { WebhookEvent, WebhookEventStatus } from './entities/webhook-event.entity';
import { UpdateIntegrationSettingsDto } from './dto/update-integration-settings.dto';
import { LinkSocialAccountDto } from './dto/link-social-account.dto';
import { ShareContentDto } from './dto/share-content.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { DiscordService } from './services/discord.service';
import { TwitterService } from './services/twitter.service';
import { IntegrationNotificationService } from './services/integration-notification.service';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
    private readonly logger = new Logger(IntegrationsController.name);

    constructor(
        @InjectRepository(IntegrationSettings)
        private readonly settingsRepo: Repository<IntegrationSettings>,
        @InjectRepository(SocialAccount)
        private readonly socialAccountRepo: Repository<SocialAccount>,
        @InjectRepository(WebhookEvent)
        private readonly webhookEventRepo: Repository<WebhookEvent>,
        private readonly discordService: DiscordService,
        private readonly twitterService: TwitterService,
        private readonly integrationNotificationService: IntegrationNotificationService,
    ) { }

    // ── Integration Settings ──────────────────────────────────────────

    @Get('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user integration settings' })
    @ApiResponse({ status: 200, description: 'Integration settings returned.' })
    async getSettings(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        let settings = await this.settingsRepo.findOne({ where: { userId } });
        if (!settings) {
            settings = this.settingsRepo.create({ userId });
            settings = await this.settingsRepo.save(settings);
        }
        return settings;
    }

    @Patch('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update integration settings' })
    @ApiResponse({ status: 200, description: 'Settings updated.' })
    @ApiBody({ type: UpdateIntegrationSettingsDto })
    async updateSettings(
        @Req() req: any,
        @Body() dto: UpdateIntegrationSettingsDto,
    ) {
        const userId = req.user.sub || req.user.id;
        let settings = await this.settingsRepo.findOne({ where: { userId } });
        if (!settings) {
            settings = this.settingsRepo.create({ userId });
        }
        Object.assign(settings, dto);
        return this.settingsRepo.save(settings);
    }

    // ── Social Account Linking ────────────────────────────────────────

    @Get('accounts')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List linked social accounts' })
    @ApiResponse({ status: 200, description: 'Linked accounts returned.' })
    async getLinkedAccounts(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        const accounts = await this.socialAccountRepo.find({ where: { userId } });
        // Strip sensitive tokens from response
        return accounts.map(({ accessToken, refreshToken, ...rest }) => rest);
    }

    @Post('accounts/link')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Link a social account' })
    @ApiResponse({ status: 201, description: 'Social account linked.' })
    @ApiResponse({ status: 400, description: 'Account already linked.' })
    @ApiBody({ type: LinkSocialAccountDto })
    @HttpCode(HttpStatus.CREATED)
    async linkAccount(
        @Req() req: any,
        @Body() dto: LinkSocialAccountDto,
    ) {
        const userId = req.user.sub || req.user.id;

        // Check if already linked
        const existing = await this.socialAccountRepo.findOne({
            where: { userId, provider: dto.provider },
        });
        if (existing) {
            throw new BadRequestException(`${dto.provider} account is already linked`);
        }

        // In a full implementation, exchange authorizationCode for tokens via the provider's OAuth endpoint.
        // For now, we store the code as a placeholder and mark the account as linked.
        const account = this.socialAccountRepo.create({
            userId,
            provider: dto.provider,
            providerUserId: dto.authorizationCode, // Placeholder; real impl would exchange code
            providerUsername: undefined,
            accessToken: dto.authorizationCode,
        });

        const saved = await this.socialAccountRepo.save(account);
        const { accessToken, refreshToken: rt, ...safe } = saved;
        return safe;
    }

    @Delete('accounts/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Unlink a social account' })
    @ApiParam({ name: 'id', description: 'Social account ID' })
    @ApiResponse({ status: 200, description: 'Account unlinked.' })
    @ApiResponse({ status: 400, description: 'Account not found.' })
    async unlinkAccount(@Req() req: any, @Param('id') id: string) {
        const userId = req.user.sub || req.user.id;
        const account = await this.socialAccountRepo.findOne({
            where: { id, userId },
        });
        if (!account) {
            throw new BadRequestException('Social account not found');
        }
        await this.socialAccountRepo.remove(account);
        return { message: `${account.provider} account unlinked successfully` };
    }

    // ── Social Sharing ────────────────────────────────────────────────

    @Post('share/achievement')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Share an achievement to social platform(s)' })
    @ApiResponse({ status: 200, description: 'Share result.' })
    @ApiBody({ type: ShareContentDto })
    @HttpCode(HttpStatus.OK)
    async shareAchievement(@Req() req: any, @Body() dto: ShareContentDto) {
        const userId = req.user.sub || req.user.id;

        if (dto.contentType !== 'achievement') {
            throw new BadRequestException('Content type must be "achievement" for this endpoint');
        }

        return this.integrationNotificationService.notifyAchievement(userId, {
            name: dto.customMessage || `Achievement ${dto.contentId}`,
            description: dto.customMessage || 'An amazing achievement!',
            achievementId: dto.contentId,
        });
    }

    @Post('share/leaderboard')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Share leaderboard ranking to social platform(s)' })
    @ApiResponse({ status: 200, description: 'Share result.' })
    @ApiBody({ type: ShareContentDto })
    @HttpCode(HttpStatus.OK)
    async shareLeaderboard(@Req() req: any, @Body() dto: ShareContentDto) {
        const userId = req.user.sub || req.user.id;

        if (dto.contentType !== 'leaderboard') {
            throw new BadRequestException('Content type must be "leaderboard" for this endpoint');
        }

        return this.integrationNotificationService.notifyLeaderboardRank(userId, {
            leaderboardName: dto.customMessage || 'Global Leaderboard',
            rank: 1,
            score: 0,
        });
    }

    // ── Webhooks ──────────────────────────────────────────────────────

    @Post('webhooks/discord')
    @ApiOperation({ summary: 'Receive Discord webhook events' })
    @ApiResponse({ status: 200, description: 'Webhook processed.' })
    @ApiResponse({ status: 400, description: 'Invalid webhook signature.' })
    @HttpCode(HttpStatus.OK)
    async handleDiscordWebhook(
        @Body() body: any,
        @Headers('x-signature-ed25519') signature?: string,
        @Headers('x-signature-timestamp') timestamp?: string,
    ) {
        // Discord interactions verification
        if (signature && timestamp) {
            const isValid = this.discordService.verifyWebhookSignature(
                JSON.stringify(body),
                signature,
                timestamp,
            );
            if (!isValid) {
                throw new BadRequestException('Invalid webhook signature');
            }
        }

        // Discord URL verification challenge (ping)
        if (body.type === 1) {
            return { type: 1 };
        }

        // Log the webhook event
        const event = this.webhookEventRepo.create({
            source: 'discord',
            eventType: body.type?.toString() || 'unknown',
            payload: body,
            status: WebhookEventStatus.RECEIVED,
        });
        const saved = await this.webhookEventRepo.save(event);

        // Process asynchronously
        this.processWebhookEvent(saved.id).catch((err) =>
            this.logger.error(`Webhook processing failed: ${err.message}`),
        );

        return { received: true, eventId: saved.id };
    }

    @Post('webhooks/external')
    @ApiOperation({ summary: 'Receive generic external webhook events' })
    @ApiResponse({ status: 200, description: 'Webhook received.' })
    @ApiBody({ type: WebhookEventDto })
    @HttpCode(HttpStatus.OK)
    async handleExternalWebhook(@Body() dto: WebhookEventDto) {
        const event = this.webhookEventRepo.create({
            source: dto.source,
            eventType: dto.eventType,
            payload: dto.payload,
            status: WebhookEventStatus.RECEIVED,
        });
        const saved = await this.webhookEventRepo.save(event);

        this.processWebhookEvent(saved.id).catch((err) =>
            this.logger.error(`Webhook processing failed: ${err.message}`),
        );

        return { received: true, eventId: saved.id };
    }

    /**
     * Process a webhook event (runs asynchronously).
     */
    private async processWebhookEvent(eventId: string): Promise<void> {
        const event = await this.webhookEventRepo.findOne({ where: { id: eventId } });
        if (!event) return;

        try {
            // Handle different event types as needed
            this.logger.log(`Processing webhook event ${eventId}: ${event.source}/${event.eventType}`);

            event.status = WebhookEventStatus.PROCESSED;
            event.processedAt = new Date();
            await this.webhookEventRepo.save(event);
        } catch (error: any) {
            event.status = WebhookEventStatus.FAILED;
            event.errorMessage = error.message;
            await this.webhookEventRepo.save(event);
        }
    }
}
