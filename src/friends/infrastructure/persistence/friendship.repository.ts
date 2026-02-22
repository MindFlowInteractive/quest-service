import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import {
  Friendship,
  UserId,
} from '../../domain/entities/domain-entities';
import { IFriendshipRepository } from '../../domain/repositories/repository-interfaces';
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * Friendship ORM Entity for persistence
 * Double-row storage: (user_id, friend_id)
 */
@Entity('friendships')
@Index('idx_friendships_user', ['user_id'])
@Index('idx_friendships_friend', ['friend_id'])
export class FriendshipEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  friend_id: string;

  @Column('timestamptz')
  created_at: Date;

  @Column('timestamptz')
  updated_at: Date;

  @Column('timestamptz', { nullable: true })
  deleted_at: Date | null;

  @Column('jsonb', { default: '{}' })
  metadata: Record<string, any>;
}

/**
 * PostgreSQL implementation of FriendshipRepository
 */
@Injectable()
export class PostgresFriendshipRepository implements IFriendshipRepository {
  private ormRepository: Repository<FriendshipEntity>;

  constructor(private dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(FriendshipEntity);
  }

  async save(friendship: Friendship): Promise<void> {
    await this.ormRepository.upsert(
      {
        id: friendship.id,
        user_id: friendship.userId.value,
        friend_id: friendship.friendId.value,
        created_at: friendship.createdAt,
        updated_at: friendship.updatedAt,
        metadata: friendship.metadata,
      },
      ['id'],
    );
  }

  async saveBatch(friendships: Friendship[]): Promise<void> {
    const entities = friendships.map((f) => ({
      id: f.id,
      user_id: f.userId.value,
      friend_id: f.friendId.value,
      created_at: f.createdAt,
      updated_at: f.updatedAt,
      metadata: f.metadata,
    }));

    await this.ormRepository.insert(entities);
  }

  async findById(id: string): Promise<Friendship | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBothDirections(
    userId: string,
    friendId: string,
  ): Promise<Friendship[]> {
    const entities = await this.ormRepository.find({
      where: [
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId },
      ],
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findFriendsOfUser(
    userId: string,
    limit: number,
    offset: number = 0,
  ): Promise<Friendship[]> {
    const entities = await this.ormRepository.find({
      where: { user_id: userId, deleted_at: null },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findFriendCountByUserId(userId: string): Promise<number> {
    return this.ormRepository.count({
      where: { user_id: userId, deleted_at: null },
    });
  }

  async delete(userId: string, friendId: string): Promise<void> {
    await this.ormRepository.softDelete({
      user_id: userId,
      friend_id: friendId,
    });
  }

  async deleteBatch(
    pairs: Array<{ userId: string; friendId: string }>,
  ): Promise<void> {
    const conditions = pairs.map((p) => ({
      user_id: p.userId,
      friend_id: p.friendId,
    }));

    for (const condition of conditions) {
      await this.ormRepository.softDelete(condition);
    }
  }

  async exists(userId: string, friendId: string): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: { user_id: userId, friend_id: friendId, deleted_at: null },
    });

    return count > 0;
  }

  async isFriend(userId: string, friendId: string): Promise<boolean> {
    return this.exists(userId, friendId);
  }

  async getMutualFriendsCount(userId1: string, userId2: string): Promise<number> {
    // Query for friends of userId1 that are also friends of userId2
    const result = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT f1.friend_id) as count
      FROM friendships f1
      INNER JOIN friendships f2 ON f1.friend_id = f2.user_id
      WHERE f1.user_id = $1
        AND f2.friend_id = $2
        AND f1.deleted_at IS NULL
        AND f2.deleted_at IS NULL
      `,
      [userId1, userId2],
    );

    return parseInt(result[0]?.count || 0, 10);
  }

  async getMutualFriendsIds(
    userId1: string,
    userId2: string,
    limit: number = 100,
  ): Promise<string[]> {
    const result = await this.dataSource.query(
      `
      SELECT f1.friend_id
      FROM friendships f1
      INNER JOIN friendships f2 ON f1.friend_id = f2.user_id
      WHERE f1.user_id = $1
        AND f2.friend_id = $2
        AND f1.deleted_at IS NULL
        AND f2.deleted_at IS NULL
      LIMIT $3
      `,
      [userId1, userId2, limit],
    );

    return result.map((r) => r.friend_id);
  }

  private toDomain(entity: FriendshipEntity): Friendship {
    return new Friendship({
      id: entity.id,
      userId: new UserId(entity.user_id),
      friendId: new UserId(entity.friend_id),
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      metadata: entity.metadata,
    });
  }
}
