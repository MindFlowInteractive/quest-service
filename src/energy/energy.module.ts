import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { UserEnergy } from './entities/user-energy.entity';
import { EnergyTransaction } from './entities/energy-transaction.entity';
import { EnergyGift } from './entities/energy-gift.entity';
import { EnergyBoost } from './entities/energy-boost.entity';
import { User } from '../users/entities/user.entity';
import { NotificationModule } from '../notifications/notification.module';
import energyConfig from './config/energy.config';

@Module({
  imports: [
    ConfigModule.forFeature(energyConfig),
    TypeOrmModule.forFeature([
      UserEnergy,
      EnergyTransaction,
      EnergyGift,
      EnergyBoost,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyModule {}