import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IBlockRepository } from '../../domain/repositories/repository-interfaces';
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * Block ORM Entity for persistence
 */
@Entity('user_blocks')
@Index('idx_block_blocker', ['blocker_id'])
@Index('idx_block_blocked', ['blocked_id'])
export class BlockEntity {
  @PrimaryColumn('uuid')
  blocker_id: string;

  @PrimaryColumn('uuid')
  blocked_id: string;

  @Column('timestamptz')
  created_at: Date;
}

/**
 * PostgreSQL implementation of BlockRepository
 */
@Injectable()
export class PostgresBlockRepository implements IBlockRepository {
  private ormRepository: Repository<BlockEntity>;

  constructor(private dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(BlockEntity);
  }

  async save(blockerId: string, blockedId: string): Promise<void> {
    await this.ormRepository.upsert(
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date(),
      },
      ['blocker_id', 'blocked_id'],
    );
  }

  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const block = await this.ormRepository.findOne({
      where: {
        blocker_id: targetUserId,
        blocked_id: userId,
      },
    });

    return !!block;
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.ormRepository.delete({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });
  }
}
