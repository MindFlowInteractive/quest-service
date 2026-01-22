import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { UserEnergy } from './entities/energy.entity';
import { EnergyBoost } from './entities/boost.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEnergy, EnergyBoost])],
  providers: [EnergyService],
  controllers: [EnergyController],
  exports: [EnergyService],
})
export class EnergyModule {}
