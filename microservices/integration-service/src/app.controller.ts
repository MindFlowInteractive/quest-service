import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @Get('oauth/:provider')
  startOAuth(@Param('provider') provider: string, @Query('redirectUri') redirectUri: string) {
    return this.appService.startOAuth(provider, redirectUri);
  }

  @Post('oauth/:provider/callback')
  completeOAuth(@Param('provider') provider: string, @Body() body: { code: string; state?: string }) {
    return this.appService.completeOAuth(provider, body.code, body.state);
  }

  @Post('connections')
  createConnection(@Body() body: { provider: string; accountId: string }) {
    return this.appService.createConnection(body.provider, body.accountId);
  }

  @Get('connections/:provider')
  getConnections(@Param('provider') provider: string) {
    return this.appService.getConnections(provider);
  }

  @Post('webhooks')
  registerWebhook(@Body() body: { integration: string; callbackUrl: string }) {
    return this.appService.registerWebhook(body.integration, body.callbackUrl);
  }

  @Post('webhooks/:id/invoke')
  invokeWebhook(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.appService.invokeWebhook(Number(id), payload);
  }
}
