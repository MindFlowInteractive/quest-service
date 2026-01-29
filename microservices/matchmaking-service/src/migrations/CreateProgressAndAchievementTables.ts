import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProgressAndAchievementTables implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Achievements table
    await queryRunner.createTable(
      new Table({
        name: 'achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'rarity',
            type: 'varchar',
            length: '20',
            default: "'common'",
          },
          {
            name: 'points',
            type: 'int',
            default: 10,
          },
          {
            name: 'iconUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'badgeUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSecret',
            type: 'boolean',
            default: false,
          },
          {
            name: 'unlockedCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'unlockRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'unlockConditions',
            type: 'jsonb',
          },
          {
            name: 'prerequisites',
            type: 'text',
            default: "''",
          },
          {
            name: 'progression',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timeConstraints',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        indices: [
          { name: 'IDX_achievements_name', columnNames: ['name'] },
          { name: 'IDX_achievements_category_isActive', columnNames: ['category', 'isActive'] },
          { name: 'IDX_achievements_rarity', columnNames: ['rarity'] },
          { name: 'IDX_achievements_unlockedCount', columnNames: ['unlockedCount'] },
          { name: 'IDX_achievements_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create User Achievements table
    await queryRunner.createTable(
      new Table({
        name: 'user_achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'achievementId',
            type: 'uuid',
          },
          {
            name: 'progress',
            type: 'int',
            default: 0,
          },
          {
            name: 'progressTotal',
            type: 'int',
            default: 100,
          },
          {
            name: 'isUnlocked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isNotified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isViewed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'unlockedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'notifiedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'viewedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'unlockContext',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'progressDetails',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          { name: 'IDX_user_achievements_userId_achievementId', columnNames: ['userId', 'achievementId'], isUnique: true },
          { name: 'IDX_user_achievements_userId_unlockedAt', columnNames: ['userId', 'unlockedAt'] },
          { name: 'IDX_user_achievements_achievementId_unlockedAt', columnNames: ['achievementId', 'unlockedAt'] },
          { name: 'IDX_user_achievements_isUnlocked', columnNames: ['isUnlocked'] },
          { name: 'IDX_user_achievements_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create Puzzle Progress table
    await queryRunner.createTable(
      new Table({
        name: 'puzzle_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'puzzleId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'not_started'",
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'score',
            type: 'int',
            default: 0,
          },
          {
            name: 'bestScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'hintsUsed',
            type: 'int',
            default: 0,
          },
          {
            name: 'timeSpent',
            type: 'int',
            default: 0,
          },
          {
            name: 'bestTime',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastAttemptAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'progress',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'metrics',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'sessionData',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          { name: 'IDX_puzzle_progress_userId_puzzleId', columnNames: ['userId', 'puzzleId'], isUnique: true },
          { name: 'IDX_puzzle_progress_userId_status', columnNames: ['userId', 'status'] },
          { name: 'IDX_puzzle_progress_puzzleId_status', columnNames: ['puzzleId', 'status'] },
          { name: 'IDX_puzzle_progress_attempts', columnNames: ['attempts'] },
          { name: 'IDX_puzzle_progress_completedAt', columnNames: ['completedAt'] },
          { name: 'IDX_puzzle_progress_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_puzzle_progress_updatedAt', columnNames: ['updatedAt'] },
        ],
      }),
      true,
    );

    // Create Game Sessions table
    await queryRunner.createTable(
      new Table({
        name: 'game_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '20',
            default: "'web'",
          },
          {
            name: 'deviceInfo',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'browserInfo',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'startTime',
            type: 'timestamp with time zone',
          },
          {
            name: 'endTime',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzlesAttempted',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzlesCompleted',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzlesFailed',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzlesSkipped',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalHintsUsed',
            type: 'int',
            default: 0,
  },
          {
            name: 'achievementsUnlocked',
            type: 'int',
            default: 0,
          },
          {
            name: 'averageAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'longestStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzleIds',
            type: 'text',
            default: "''",
          },
          {
            name: 'categoriesPlayed',
            type: 'text',
            default: "''",
          },
          {
            name: 'analytics',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'sessionConfig',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'sessionState',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'contextData',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'ongoing'",
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          { name: 'IDX_game_sessions_userId_startTime', columnNames: ['userId', 'startTime'] },
          { name: 'IDX_game_sessions_sessionId', columnNames: ['sessionId'], isUnique: true },
          { name: 'IDX_game_sessions_userId_isActive', columnNames: ['userId', 'isActive'] },
          { name: 'IDX_game_sessions_endTime', columnNames: ['endTime'] },
          { name: 'IDX_game_sessions_platform', columnNames: ['platform'] },
          { name: 'IDX_game_sessions_puzzlesAttempted', columnNames: ['puzzlesAttempted'] },
          { name: 'IDX_game_sessions_puzzlesCompleted', columnNames: ['puzzlesCompleted'] },
          { name: 'IDX_game_sessions_totalScore', columnNames: ['totalScore'] },
          { name: 'IDX_game_sessions_startTime', columnNames: ['startTime'] },
          { name: 'IDX_game_sessions_status', columnNames: ['status'] },
          { name: 'IDX_game_sessions_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_game_sessions_updatedAt', columnNames: ['updatedAt'] },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'user_achievements',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_achievements',
      new TableForeignKey({
        columnNames: ['achievementId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'achievements',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'puzzle_progress',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'puzzle_progress',
      new TableForeignKey({
        columnNames: ['puzzleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'puzzles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'game_sessions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('game_sessions');
    await queryRunner.dropTable('puzzle_progress');
    await queryRunner.dropTable('user_achievements');
    await queryRunner.dropTable('achievements');
  }
}
