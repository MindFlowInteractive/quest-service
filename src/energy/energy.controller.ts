import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnergyService } from './energy.service';
import { SendEnergyGiftDto } from './dto/send-energy-gift.dto';
import { RefillEnergyDto } from './dto/refill-energy.dto';
import { ApplyBoostDto } from './dto/apply-boost.dto';

@ApiTags('energy')
@Controller('energy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get user energy status' })
  @ApiResponse({ status: 200, description: 'Energy status retrieved successfully' })
  async getEnergyStatus(@Request() req) {
    return await this.energyService.getEnergyStats(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get energy transaction history' })
  @ApiResponse({ status: 200, description: 'Energy history retrieved successfully' })
  async getEnergyHistory(
    @Request() req,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0'
  ) {
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    if (limitNum > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }

    return await this.energyService.getEnergyHistory(
      req.user.id,
      limitNum,
      offsetNum
    );
  }

  @Post('refill')
  @ApiOperation({ summary: 'Refill energy using tokens' })
  @ApiResponse({ status: 200, description: 'Energy refilled successfully' })
  async refillEnergy(@Request() req, @Body() refillDto: RefillEnergyDto) {
    return await this.energyService.refillEnergyWithTokens(
      req.user.id,
      refillDto.tokensToSpend
    );
  }

  @Post('gifts/send')
  @ApiOperation({ summary: 'Send energy gift to another user' })
  @ApiResponse({ status: 201, description: 'Energy gift sent successfully' })
  async sendEnergyGift(@Request() req, @Body() giftDto: SendEnergyGiftDto) {
    return await this.energyService.sendEnergyGift(
      req.user.id,
      giftDto.recipientId,
      giftDto.energyAmount,
      giftDto.message
    );
  }

  @Post('gifts/:giftId/accept')
  @ApiOperation({ summary: 'Accept a pending energy gift' })
  @ApiResponse({ status: 200, description: 'Energy gift accepted successfully' })
  async acceptEnergyGift(@Request() req, @Param('giftId') giftId: string) {
    return await this.energyService.acceptEnergyGift(req.user.id, giftId);
  }

  @Get('gifts/pending')
  @ApiOperation({ summary: 'Get pending energy gifts' })
  @ApiResponse({ status: 200, description: 'Pending gifts retrieved successfully' })
  async getPendingGifts(@Request() req) {
    return await this.energyService.getPendingGifts(req.user.id);
  }

  @Post('boosts/apply')
  @ApiOperation({ summary: 'Apply an energy boost' })
  @ApiResponse({ status: 200, description: 'Energy boost applied successfully' })
  async applyBoost(@Request() req, @Body() boostDto: ApplyBoostDto) {
    return await this.energyService.applyEnergyBoost(req.user.id, boostDto.boostId);
  }

  @Post('consume')
  @ApiOperation({ 
    summary: 'Consume energy (internal use)',
    description: 'This endpoint is typically called by other services when starting puzzles'
  })
  @ApiResponse({ status: 200, description: 'Energy consumed successfully' })
  async consumeEnergy(
    @Request() req,
    @Body() consumeDto: { amount: number; relatedEntityId?: string; relatedEntityType?: string; metadata?: any }
  ) {
    return await this.energyService.consumeEnergy(
      req.user.id,
      consumeDto.amount,
      consumeDto.relatedEntityId,
      consumeDto.relatedEntityType,
      consumeDto.metadata
    );
  }
}