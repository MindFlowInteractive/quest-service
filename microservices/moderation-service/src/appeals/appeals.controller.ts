import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { AppealsService, CreateAppealDto, ResolveAppealDto } from './appeals.service';

@Controller('appeals')
export class AppealsController {
    constructor(private readonly appealsService: AppealsService) { }

    @Post()
    async createAppeal(@Body() dto: CreateAppealDto) {
        return this.appealsService.createAppeal(dto);
    }

    @Get()
    async findAll() {
        return this.appealsService.findAll();
    }

    @Get('pending')
    async findPending() {
        return this.appealsService.findPending();
    }

    @Get('stats')
    async getStats() {
        return this.appealsService.getAppealStats();
    }

    @Get('user/:userId')
    async getByUser(@Param('userId') userId: string) {
        return this.appealsService.getAppealsByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.appealsService.findOne(id);
    }

    @Patch(':id/assign')
    async assignToReviewer(
        @Param('id') id: string,
        @Body('reviewerId') reviewerId: string,
    ) {
        return this.appealsService.assignToReviewer(id, reviewerId);
    }

    @Post(':id/resolve')
    async resolveAppeal(
        @Param('id') id: string,
        @Body() dto: ResolveAppealDto,
    ) {
        return this.appealsService.resolveAppeal(id, dto);
    }
}
