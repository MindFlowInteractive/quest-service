import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import {
  ActivityEvent,
  ActivityEventType,
  PrivacyLevel,
  UserId,
} from '../../domain/entities/domain-entities';
import { IActivityEventRepository } from '../../domain/repositories/repository-interfaces';
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * ActivityEvent ORM Entity for persistence
 */
@Entity('activity_events')
@Index('idx_activity_actor_created', ['actor_user_id', 'created_at'])
@Index('idx_activity_created', ['created_at'])
export class ActivityEventEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  actor_user_id: string;

  @Column('varchar')
  event_type: string;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column('varchar')
  visibility: string;

  @Column('timestamptz')
  created_at: Date;

  @Column('timestamptz', { nullable: true })
  deleted_at: Date | null;

  @Column('jsonb', { default: '{}' })
  metadata: Record<string, any>;
}

/**
 * PostgreSQL implementation of ActivityEventRepository
 */
@Injectable()
export class PostgresActivityEventRepository implements IActivityEventRepository {
  private ormRepository: Repository<ActivityEventEntity>;

  constructor(private dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ActivityEventEntity);
  }

  async save(event: ActivityEvent): Promise<void> {
    await this.ormRepository.upsert(
      {
        id: event.id,
        actor_user_id: event.actorUserId.value,
        event_type: event.eventType,
        payload: event.payload,
        visibility: event.visibility,
        created_at: event.createdAt,
        deleted_at: event.deletedAt,
        metadata: event.metadata,
      },
      ['id'],
    );
  }

  async findById(id: string): Promise<ActivityEvent | null> {
    const entity = await this.ormRepository.findOne({
      where: { id, deleted_at: null },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByActorUserId(
    actorUserId: string,
    limit: number,
    offset: number = 0,
  ): Promise<ActivityEvent[]> {
    const entities = await this.ormRepository.find({
      where: { actor_user_id: actorUserId, deleted_at: null },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findRecentByActorIds(
    actorUserIds: string[],
    limit: number,
  ): Promise<ActivityEvent[]> {
    const entities = await this.dataSource
      .createQueryBuilder()
      .select('ae')
      .from(ActivityEventEntity, 'ae')
      .where('ae.actor_user_id IN (:...actorUserIds)', {
        actorUserIds,
      })
      .andWhere('ae.deleted_at IS NULL')
      .orderBy('ae.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((e) => this.toDomain(e));
  }

  async countByActorUserId(actorUserId: string): Promise<number> {
    return this.ormRepository.count({
      where: { actor_user_id: actorUserId, deleted_at: null },
    });
  }

  async findByIds(ids: string[]): Promise<ActivityEvent[]> {
    const entities = await this.ormRepository.find({
      where: { id: In(ids), deleted_at: null },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: ActivityEventEntity): ActivityEvent {
    return new ActivityEvent({
      id: entity.id,
      actorUserId: new UserId(entity.actor_user_id),
      eventType: entity.event_type as ActivityEventType,
      payload: entity.payload,
      visibility: entity.visibility as PrivacyLevel,
      createdAt: entity.created_at,
      deletedAt: entity.deleted_at,
      metadata: entity.metadata,
    });
  }
}
