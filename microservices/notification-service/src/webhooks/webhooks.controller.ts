import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) {}

    @Post()
    async create(@Body() body: { userId: string; url: string; events: string[]; secret?: string }) {
        return this.webhooksService.create(body.userId, body.url, body.events, body.secret);
    }

    @Get('user/:userId')
    async findByUserId(@Param('userId') userId: string) {
        return this.webhooksService.findByUserId(userId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updates: any) {
        return this.webhooksService.update(id, updates);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.webhooksService.delete(id);
        return { success: true };
    }
}
