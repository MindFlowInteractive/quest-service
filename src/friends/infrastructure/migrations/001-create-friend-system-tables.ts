import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFriendSystemTables1676500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create friendships table (double-row storage)
    await queryRunner.createTable(
      new Table({
        name: 'friendships',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'friend_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
        ],
        uniques: [
          {
            name: 'UQ_friendships_user_friend',
            columnNames: ['user_id', 'friend_id'],
          },
        ],
      }),
    );

    // Create indexes for friendships
    await queryRunner.createIndices('friendships', [
      new TableIndex({
        name: 'idx_friendships_user',
        columnNames: ['user_id'],
      }),
      new TableIndex({
        name: 'idx_friendships_friend',
        columnNames: ['friend_id'],
      }),
    ]);

    // Create friend_requests table
    await queryRunner.createTable(
      new Table({
        name: 'friend_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'from_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'to_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'state',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'message',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'responded_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        uniques: [
          {
            name: 'UQ_friend_requests_from_to',
            columnNames: ['from_user_id', 'to_user_id'],
          },
        ],
      }),
    );

    // Create indexes for friend_requests
    await queryRunner.createIndices('friend_requests', [
      new TableIndex({
        name: 'idx_fr_to_state',
        columnNames: ['to_user_id', 'state', 'created_at'],
      }),
      new TableIndex({
        name: 'idx_fr_from_state',
        columnNames: ['from_user_id', 'state', 'created_at'],
      }),
    ]);

    // Create privacy_settings table
    await queryRunner.createTable(
      new Table({
        name: 'privacy_settings',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'profile_visibility',
            type: 'varchar',
            default: "'PUBLIC'",
          },
          {
            name: 'show_activity_to',
            type: 'varchar',
            default: "'FRIENDS_ONLY'",
          },
          {
            name: 'leaderboard_visibility',
            type: 'varchar',
            default: "'PUBLIC'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
        ],
      }),
    );

    // Create activity_events table
    await queryRunner.createTable(
      new Table({
        name: 'activity_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'actor_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'visibility',
            type: 'varchar',
            default: "'PUBLIC'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
        ],
      }),
    );

    // Create indexes for activity_events
    await queryRunner.createIndices('activity_events', [
      new TableIndex({
        name: 'idx_activity_actor_created',
        columnNames: ['actor_user_id', 'created_at'],
      }),
      new TableIndex({
        name: 'idx_activity_created',
        columnNames: ['created_at'],
      }),
    ]);

    // Create user_blocks table
    await queryRunner.createTable(
      new Table({
        name: 'user_blocks',
        columns: [
          {
            name: 'blocker_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'blocked_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    // Create indexes for user_blocks
    await queryRunner.createIndices('user_blocks', [
      new TableIndex({
        name: 'idx_block_blocker',
        columnNames: ['blocker_id'],
      }),
      new TableIndex({
        name: 'idx_block_blocked',
        columnNames: ['blocked_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_blocks');
    await queryRunner.dropTable('activity_events');
    await queryRunner.dropTable('privacy_settings');
    await queryRunner.dropTable('friend_requests');
    await queryRunner.dropTable('friendships');
  }
}
