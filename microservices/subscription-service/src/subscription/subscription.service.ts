import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
  ) {}

  findAll(): Promise<Subscription[]> {
    return this.repo.find();
  }

  findByUser(userId: string): Promise<Subscription[]> {
    return this.repo.find({ where: { userId } });
  }

  create(userId: string, plan: string): Promise<Subscription> {
    const sub = this.repo.create({ userId, plan });
    return this.repo.save(sub);
  }
}