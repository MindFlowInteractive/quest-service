import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserEnergy } from './entities/energy.entity';
import { EnergyBoost, BoostType } from './entities/boost.entity';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(UserEnergy)
    private readonly energyRepository: Repository<UserEnergy>,
    @InjectRepository(EnergyBoost)
    private readonly boostRepository: Repository<EnergyBoost>,
  ) {}

  async getEnergyState(userId: string): Promise<UserEnergy> {
    let energy = await this.energyRepository.findOne({ where: { userId } });

    if (!energy) {
      energy = this.energyRepository.create({
        userId,
        currentEnergy: 100,
        maxEnergy: 100,
        lastRegenerationAt: new Date(),
        regenerationRate: 300,
      });
      await this.energyRepository.save(energy);
    }

    return this.recalculateEnergy(energy);
  }

  private async recalculateEnergy(energy: UserEnergy): Promise<UserEnergy> {
    const now = new Date();
    const secondsPassed = Math.floor((now.getTime() - energy.lastRegenerationAt.getTime()) / 1000);

    if (secondsPassed <= 0 || energy.currentEnergy >= energy.maxEnergy) {
      return energy;
    }

    const activeBoosts = await this.boostRepository.find({
      where: { userId: energy.userId, expiresAt: MoreThan(now) },
    });

    let effectiveRegenRate = energy.regenerationRate;
    const regenBoost = activeBoosts.find(b => b.type === BoostType.REGEN_SPEED);
    if (regenBoost) {
      effectiveRegenRate /= regenBoost.multiplier;
    }

    const energyToGain = Math.floor(secondsPassed / effectiveRegenRate);
    if (energyToGain > 0) {
      energy.currentEnergy = Math.min(energy.maxEnergy, energy.currentEnergy + energyToGain);
      energy.lastRegenerationAt = new Date(
        energy.lastRegenerationAt.getTime() + energyToGain * effectiveRegenRate * 1000,
      );
      await this.energyRepository.save(energy);
    }

    return energy;
  }

  async consumeEnergy(userId: string, amount: number): Promise<UserEnergy> {
    const energy = await this.getEnergyState(userId);

    const activeBoosts = await this.boostRepository.find({
      where: { userId, expiresAt: MoreThan(new Date()), type: BoostType.UNLIMITED },
    });

    if (activeBoosts.length > 0) {
      return energy; // No consumption during unlimited energy boost
    }

    if (energy.currentEnergy < amount) {
      throw new BadRequestException('Insufficient energy');
    }

    energy.currentEnergy -= amount;
    // Reset regen anchor if we were at max energy
    if (energy.currentEnergy + amount >= energy.maxEnergy) {
      energy.lastRegenerationAt = new Date();
    }

    return this.energyRepository.save(energy);
  }

  async refillEnergy(userId: string, amount: number): Promise<UserEnergy> {
    const energy = await this.getEnergyState(userId);
    energy.currentEnergy = Math.min(energy.maxEnergy, energy.currentEnergy + amount);
    return this.energyRepository.save(energy);
  }

  async giftEnergy(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    const senderEnergy = await this.getEnergyState(fromUserId);
    if (senderEnergy.currentEnergy < amount) {
      throw new BadRequestException('Insufficient energy to gift');
    }

    senderEnergy.currentEnergy -= amount;
    await this.energyRepository.save(senderEnergy);

    const receiverEnergy = await this.getEnergyState(toUserId);
    receiverEnergy.currentEnergy = Math.min(receiverEnergy.maxEnergy, receiverEnergy.currentEnergy + amount);
    await this.energyRepository.save(receiverEnergy);
  }

  async applyBoost(userId: string, type: BoostType, multiplier: number, durationMinutes: number): Promise<EnergyBoost> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    const boost = this.boostRepository.create({
      userId,
      type,
      multiplier,
      expiresAt,
    });

    return this.boostRepository.save(boost);
  }
}
