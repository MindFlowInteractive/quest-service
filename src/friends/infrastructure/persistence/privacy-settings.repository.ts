import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import {
  PrivacySettings,
  PrivacyLevel,
  UserId,
} from '../../domain/entities/domain-entities';
import { IPrivacySettingsRepository } from '../../domain/repositories/repository-interfaces';
import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * PrivacySettings ORM Entity for persistence
 */
@Entity('privacy_settings')
export class PrivacySettingsEntity {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column('varchar')
  profile_visibility: string;

  @Column('varchar')
  show_activity_to: string;

  @Column('varchar')
  leaderboard_visibility: string;

  @Column('timestamptz')
  created_at: Date;

  @Column('timestamptz')
  updated_at: Date;

  @Column('jsonb', { default: '{}' })
  metadata: Record<string, any>;
}

/**
 * PostgreSQL implementation of PrivacySettingsRepository
 */
@Injectable()
export class PostgresPrivacySettingsRepository
  implements IPrivacySettingsRepository
{
  private ormRepository: Repository<PrivacySettingsEntity>;

  constructor(private dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(PrivacySettingsEntity);
  }

  async save(privacySettings: PrivacySettings): Promise<void> {
    await this.ormRepository.upsert(
      {
        user_id: privacySettings.userId.value,
        profile_visibility: privacySettings.profileVisibility,
        show_activity_to: privacySettings.showActivityTo,
        leaderboard_visibility: privacySettings.leaderboardVisibility,
        created_at: privacySettings.createdAt,
        updated_at: privacySettings.updatedAt,
        metadata: privacySettings.metadata,
      },
      ['user_id'],
    );
  }

  async findByUserId(userId: string): Promise<PrivacySettings | null> {
    const entity = await this.ormRepository.findOne({ where: { user_id: userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserIds(userIds: string[]): Promise<Map<string, PrivacySettings>> {
    const entities = await this.ormRepository.find({
      where: { user_id: In(userIds) },
    });

    const result = new Map<string, PrivacySettings>();
    for (const entity of entities) {
      result.set(entity.user_id, this.toDomain(entity));
    }

    return result;
  }

  private toDomain(entity: PrivacySettingsEntity): PrivacySettings {
    return new PrivacySettings({
      userId: new UserId(entity.user_id),
      profileVisibility: entity.profile_visibility as PrivacyLevel,
      showActivityTo: entity.show_activity_to as PrivacyLevel,
      leaderboardVisibility: entity.leaderboard_visibility as PrivacyLevel,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      metadata: entity.metadata,
    });
  }
}
