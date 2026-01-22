import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEnergy, EnergyType } from './energy.entity';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(UserEnergy)
    private readonly energyRepository: Repository<UserEnergy>,
  ) {}

  async getUserEnergy(
    userId: string,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<UserEnergy> {
    let userEnergy = await this.energyRepository.findOne({
      where: { userId, energyType },
    });

    if (!userEnergy) {
      userEnergy = this.energyRepository.create({
        userId,
        energyType,
        currentAmount: 100,
        maxAmount: 100,
        regenerationRate: 300,
        regenerationInterval: 60,
        lastRegenerationTime: new Date(),
      });
      await this.energyRepository.save(userEnergy);
    }

    return userEnergy;
  }

  async consumeEnergy(
    userId: string,
    amount: number,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<UserEnergy> {
    const userEnergy = await this.getUserEnergy(userId, energyType);

    if (userEnergy.currentAmount < amount) {
      throw new Error('Insufficient energy');
    }

    userEnergy.currentAmount -= amount;
    return this.energyRepository.save(userEnergy);
  }

  async addEnergy(
    userId: string,
    amount: number,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<UserEnergy> {
    const userEnergy = await this.getUserEnergy(userId, energyType);

    userEnergy.currentAmount = Math.min(
      userEnergy.currentAmount + amount,
      userEnergy.maxAmount,
    );
    return this.energyRepository.save(userEnergy);
  }

  async refillEnergy(
    userId: string,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<UserEnergy> {
    const userEnergy = await this.getUserEnergy(userId, energyType);
    userEnergy.currentAmount = userEnergy.maxAmount;
    userEnergy.lastRegenerationTime = new Date();
    return this.energyRepository.save(userEnergy);
  }

  async updateMaxEnergy(
    userId: string,
    maxAmount: number,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<UserEnergy> {
    const userEnergy = await this.getUserEnergy(userId, energyType);
    userEnergy.maxAmount = maxAmount;

    if (userEnergy.currentAmount > maxAmount) {
      userEnergy.currentAmount = maxAmount;
    }

    return this.energyRepository.save(userEnergy);
  }
}
