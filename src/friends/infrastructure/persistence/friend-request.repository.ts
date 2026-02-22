import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  FriendRequest,
  FriendRequestState,
  UserId,
} from '../../domain/entities/domain-entities';
import { IFriendRequestRepository } from '../../domain/repositories/repository-interfaces';

/**
 * FriendRequest ORM Entity for persistence
 */
import { Entity, PrimaryColumn, Column, Index, Unique } from 'typeorm';

@Entity('friend_requests')
@Unique(['from_user_id', 'to_user_id'])
@Index('idx_fr_to_state', ['to_user_id', 'state', 'created_at'])
@Index('idx_fr_from_state', ['from_user_id', 'state', 'created_at'])
export class FriendRequestEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  from_user_id: string;

  @Column('uuid')
  to_user_id: string;

  @Column('varchar')
  state: string;

  @Column('varchar', { nullable: true })
  message: string | null;

  @Column('timestamptz')
  created_at: Date;

  @Column('timestamptz')
  updated_at: Date;

  @Column('timestamptz', { nullable: true })
  responded_at: Date | null;

  @Column('timestamptz', { nullable: true })
  expires_at: Date | null;
}

/**
 * PostgreSQL implementation of FriendRequestRepository
 */
@Injectable()
export class PostgresFriendRequestRepository
  implements IFriendRequestRepository
{
  private ormRepository: Repository<FriendRequestEntity>;

  constructor(private dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(FriendRequestEntity);
  }

  async save(friendRequest: FriendRequest): Promise<void> {
    await this.ormRepository.upsert(
      {
        id: friendRequest.id,
        from_user_id: friendRequest.fromUserId.value,
        to_user_id: friendRequest.toUserId.value,
        state: friendRequest.state,
        message: friendRequest.message,
        created_at: friendRequest.createdAt,
        updated_at: friendRequest.updatedAt,
        responded_at: friendRequest.respondedAt,
        expires_at: friendRequest.expiresAt,
      },
      ['id'],
    );
  }

  async findById(id: string): Promise<FriendRequest | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findByUsersPair(
    fromUserId: string,
    toUserId: string,
  ): Promise<FriendRequest | null> {
    const entity = await this.ormRepository.findOne({
      where: { from_user_id: fromUserId, to_user_id: toUserId },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findInboundByUserId(userId: string, limit: number): Promise<FriendRequest[]> {
    const entities = await this.ormRepository.find({
      where: { to_user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findOutboundByUserId(
    userId: string,
    limit: number,
  ): Promise<FriendRequest[]> {
    const entities = await this.ormRepository.find({
      where: { from_user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findByIds(ids: string[]): Promise<FriendRequest[]> {
    const entities = await this.ormRepository.findByIds(ids);
    return entities.map((e) => this.toDomain(e));
  }

  async deletePermanently(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  private toDomain(entity: FriendRequestEntity): FriendRequest {
    return new FriendRequest({
      id: entity.id,
      fromUserId: new UserId(entity.from_user_id),
      toUserId: new UserId(entity.to_user_id),
      state: entity.state as FriendRequestState,
      message: entity.message,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      respondedAt: entity.responded_at,
      expiresAt: entity.expires_at,
    });
  }
}
