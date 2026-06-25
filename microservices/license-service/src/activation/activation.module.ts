import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activation } from './entities/activation.entity';
import { ActivationService } from './activation.service';
import { ActivationController } from './activation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activation])],
  providers: [ActivationService],
  controllers: [ActivationController],
  exports: [ActivationService],
})
export class ActivationModule {}
