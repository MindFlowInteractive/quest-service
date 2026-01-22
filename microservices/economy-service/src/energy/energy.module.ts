import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEnergy } from './energy.entity';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { EnergyRegenerationService } from './energy-regeneration.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEnergy])],
  controllers: [EnergyController],
  providers: [EnergyService, EnergyRegenerationService],
  exports: [EnergyService],
})
export class EnergyModule {}
