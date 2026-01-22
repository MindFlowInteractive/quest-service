import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { ConsumeEnergyDto, RefillEnergyDto, GiftEnergyDto, ApplyBoostDto } from './energy.dto';

@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get(':userId')
  getEnergy(@Param('userId') userId: string) {
    return this.energyService.getEnergyState(userId);
  }

  @Post('consume')
  consumeEnergy(@Body() dto: ConsumeEnergyDto) {
    return this.energyService.consumeEnergy(dto.userId, dto.amount);
  }

  @Post('refill')
  refillEnergy(@Body() dto: RefillEnergyDto) {
    return this.energyService.refillEnergy(dto.userId, dto.amount);
  }

  @Post('gift')
  giftEnergy(@Body() dto: GiftEnergyDto) {
    return this.energyService.giftEnergy(dto.fromUserId, dto.toUserId, dto.amount);
  }

  @Post('boost')
  applyBoost(@Body() dto: ApplyBoostDto) {
    return this.energyService.applyBoost(dto.userId, dto.type, dto.multiplier, dto.durationMinutes);
  }
}
