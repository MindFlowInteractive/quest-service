import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialSchema1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS social');

    // Create friends table
    await queryRunner.query(
      `
      CREATE TABLE social.friends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "friendId" UUID NOT NULL,
        nickname TEXT,
        "isBlocked" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "friendId")
      )
    `,
    );

    // Create friend_requests table
    await queryRunner.query(
      `
      CREATE TABLE social.friend_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "requesterId" UUID NOT NULL,
        "recipientId" UUID NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("requesterId", "recipientId")
      )
    `,
    );

    // Create leaderboard_entries table
    await queryRunner.query(
      `
      CREATE TABLE social.leaderboard_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "seasonId" VARCHAR(255) NOT NULL DEFAULT 'current',
        score BIGINT NOT NULL DEFAULT 0,
        rank INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        "displayName" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "seasonId")
      )
    `,
    );

    // Create multiplayer_rooms table
    await queryRunner.query(
      `
      CREATE TABLE social.multiplayer_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
        participants TEXT[] DEFAULT '{}',
        "maxPlayers" INTEGER NOT NULL DEFAULT 2,
        "isPrivate" BOOLEAN NOT NULL DEFAULT FALSE,
        password TEXT,
        "puzzleId" UUID,
        metadata JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
    );

    // Create indices
    await queryRunner.query(
      'CREATE INDEX idx_friends_userId ON social.friends("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_friends_userId_friendId ON social.friends("userId", "friendId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_friend_requests_requesterId_recipientId ON social.friend_requests("requesterId", "recipientId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_friend_requests_recipientId ON social.friend_requests("recipientId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_leaderboard_seasonId_rank ON social.leaderboard_entries("seasonId", rank)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_leaderboard_userId ON social.leaderboard_entries("userId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_multiplayer_rooms_ownerId ON social.multiplayer_rooms("ownerId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_multiplayer_rooms_status ON social.multiplayer_rooms(status)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_multiplayer_rooms_status');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_multiplayer_rooms_ownerId');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_leaderboard_userId');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_leaderboard_seasonId_rank');
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_friend_requests_recipientId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_friend_requests_requesterId_recipientId',
    );
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_friends_userId_friendId');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_friends_userId');

    // Drop tables
    await queryRunner.query('DROP TABLE IF EXISTS social.multiplayer_rooms');
    await queryRunner.query('DROP TABLE IF EXISTS social.leaderboard_entries');
    await queryRunner.query('DROP TABLE IF EXISTS social.friend_requests');
    await queryRunner.query('DROP TABLE IF EXISTS social.friends');

    // Drop schema
    await queryRunner.query('DROP SCHEMA IF EXISTS social');
  }
}
