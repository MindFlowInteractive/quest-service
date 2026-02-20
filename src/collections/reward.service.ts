import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CollectionEntity } from './entities/collection.entity';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);
  constructor(private dataSource: DataSource) {}

  async dispatchReward(
    user_id: string,
    collection: CollectionEntity,
    queryRunner: any,
  ): Promise<void> {
    // Must be called inside transaction using provided queryRunner
    // Idempotency enforced by checking/setting reward_claimed in user_collection_progress
    const { reward_type, reward_value } = collection;

    // For demo, just insert into a `user_rewards` table (create if needed)
    // Using sqlite-compatible syntax for cross-db support
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS user_rewards (user_id TEXT, collection_id TEXT, reward_type TEXT, reward_value INTEGER, granted_at DATETIME)`,
    );

    await queryRunner.query(
      `INSERT INTO user_rewards(user_id, collection_id, reward_type, reward_value, granted_at) VALUES(?, ?, ?, ?, datetime('now'))`,
      [user_id, collection.id, reward_type, reward_value],
    );

    this.logger.log(
      `Granted reward to ${user_id} for collection ${collection.id}: ${reward_type}=${reward_value}`,
    );
  }
}
