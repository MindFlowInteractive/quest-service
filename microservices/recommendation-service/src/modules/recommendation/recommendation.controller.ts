import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('recommendations')
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @Get(':playerId')
    async getRecommendations(@Param('playerId') playerId: string) {
        return this.recommendationService.getRecommendations(playerId);
    }

    @Post('track')
    async trackAction(@Body() body: { playerId: string; puzzleId: string; action: string; metadata?: any }) {
        return this.recommendationService.trackAction(body.playerId, body.puzzleId, body.action, body.metadata);
    }

    // Microservice patterns
    @MessagePattern('get_recommendations')
    async handleGetRecommendations(@Payload() data: { playerId: string }) {
        return this.recommendationService.getRecommendations(data.playerId);
    }

    @MessagePattern('track_player_behavior')
    async handleTrackBehavior(@Payload() data: { playerId: string; puzzleId: string; action: string; metadata?: any }) {
        return this.recommendationService.trackAction(data.playerId, data.puzzleId, data.action, data.metadata);
    }
}
