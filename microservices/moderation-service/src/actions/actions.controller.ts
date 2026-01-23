import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
    constructor(private readonly actionsService: ActionsService) { }

    @Post('warn')
    async warnUser(@Body() body: { userId: string; reason: string }) {
        return this.actionsService.warnUser(body.userId, body.reason);
    }

    @Post('suspend')
    async suspendUser(@Body() body: { userId: string; reason: string; duration?: string }) {
        return this.actionsService.suspendUser(body.userId, body.reason, body.duration);
    }

    @Post('ban')
    async banUser(@Body() body: { userId: string; reason: string }) {
        return this.actionsService.banUser(body.userId, body.reason);
    }

    @Get('user/:userId')
    async getUserViolations(@Param('userId') userId: string) {
        return this.actionsService.getUserViolations(userId);
    }
}
