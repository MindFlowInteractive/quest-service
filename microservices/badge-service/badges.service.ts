import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BadgeEntity } from './entities/badge.entity';
import { CredentialEntity } from '../../credentials/entities/credential.entity';

import { randomUUID } from 'crypto';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(BadgeEntity)
    private readonly badgeRepo: Repository<BadgeEntity>,

    @InjectRepository(CredentialEntity)
    private readonly credentialRepo: Repository<CredentialEntity>,
  ) {}

  async issueBadge(
    userId: string,
    badgeId: string,
  ) {
    const credential = this.credentialRepo.create({
      userId,
      badgeId,
      verificationCode: randomUUID(),
    });

    return this.credentialRepo.save(credential);
  }
}