import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PreferenceService } from './preference.service';

@Controller('preferences')
export class PreferenceController {
    constructor(private readonly preferenceService: PreferenceService) { }

    @Get(':playerId')
    async getPreference(@Param('playerId') playerId: string) {
        return this.preferenceService.getPreference(playerId);
    }

    @Post(':playerId')
    async updatePreference(@Param('playerId') playerId: string, @Body() data: any) {
        return this.preferenceService.updatePreference(playerId, data);
    }
}
