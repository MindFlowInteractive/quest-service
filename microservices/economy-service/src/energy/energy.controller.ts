import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnergyService } from './energy.service';
import { EnergyRegenerationService } from './energy-regeneration.service';
import { EnergyType } from './energy.entity';

export class ConsumeEnergyDto {
  amount: number;
  energyType?: EnergyType = EnergyType.ENERGY;
}

export class AddEnergyDto {
  amount: number;
  energyType?: EnergyType = EnergyType.ENERGY;
}

export class UpdateMaxEnergyDto {
  maxAmount: number;
  energyType?: EnergyType = EnergyType.ENERGY;
}

@Controller('energy')
export class EnergyController {
  constructor(
    private readonly energyService: EnergyService,
    private readonly energyRegenerationService: EnergyRegenerationService,
  ) {}

  @Get(':userId')
  async getUserEnergy(
    @Param('userId') userId: string,
    @Body() body: { energyType?: EnergyType },
  ) {
    const energyType = body.energyType || EnergyType.ENERGY;
    return this.energyService.getUserEnergy(userId, energyType);
  }

  @Get(':userId/status')
  async getEnergyStatus(
    @Param('userId') userId: string,
    @Body() body: { energyType?: EnergyType },
  ) {
    const energyType = body.energyType || EnergyType.ENERGY;
    return this.energyRegenerationService.getEnergyRegenerationStatus(
      userId,
      energyType,
    );
  }

  @Post(':userId/consume')
  @HttpCode(HttpStatus.OK)
  async consumeEnergy(
    @Param('userId') userId: string,
    @Body() consumeEnergyDto: ConsumeEnergyDto,
  ) {
    return this.energyService.consumeEnergy(
      userId,
      consumeEnergyDto.amount,
      consumeEnergyDto.energyType,
    );
  }

  @Post(':userId/add')
  @HttpCode(HttpStatus.OK)
  async addEnergy(
    @Param('userId') userId: string,
    @Body() addEnergyDto: AddEnergyDto,
  ) {
    return this.energyService.addEnergy(
      userId,
      addEnergyDto.amount,
      addEnergyDto.energyType,
    );
  }

  @Post(':userId/refill')
  @HttpCode(HttpStatus.OK)
  async refillEnergy(
    @Param('userId') userId: string,
    @Body() body: { energyType?: EnergyType },
  ) {
    const energyType = body.energyType || EnergyType.ENERGY;
    return this.energyService.refillEnergy(userId, energyType);
  }

  @Put(':userId/max')
  async updateMaxEnergy(
    @Param('userId') userId: string,
    @Body() updateMaxEnergyDto: UpdateMaxEnergyDto,
  ) {
    return this.energyService.updateMaxEnergy(
      userId,
      updateMaxEnergyDto.maxAmount,
      updateMaxEnergyDto.energyType,
    );
  }
}
