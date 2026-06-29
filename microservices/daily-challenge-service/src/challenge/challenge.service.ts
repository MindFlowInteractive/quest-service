import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private readonly repo: Repository<Challenge>,
  ) {}

  findAll(): Promise<Challenge[]> {
    return this.repo.find({ order: { scheduledDate: 'DESC' } });
  }

  findToday(): Promise<Challenge | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.repo.findOne({ where: { scheduledDate: today } });
  }

  create(title: string, scheduledDate: string): Promise<Challenge> {
    const challenge = this.repo.create({ title, scheduledDate });
    return this.repo.save(challenge);
  }
}