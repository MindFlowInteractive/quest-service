import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSupportingTables1732800000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create User Stats table
    await queryRunner.createTable(
      new Table({
        name: 'user_stats',
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
            isUnique: true,
          },
          {
            name: 'totalPuzzlesAttempted',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalPuzzlesCompleted',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalPuzzlesFailed',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalTimeSpent',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalHintsUsed',
            type: 'int',
            default: 0,
          },
          {
            name: 'currentStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'longestStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'overallAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'averageCompletionTime',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'totalAchievements',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalGameSessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'difficultyStats',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'categoryStats',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'timeStats',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'trends',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'milestones',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'rankings',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'lastActivityAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastCalculatedAt',
            type: 'timestamp with time zone',
            isNullable: true,
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
          { name: 'IDX_user_stats_userId', columnNames: ['userId'], isUnique: true },
          { name: 'IDX_user_stats_totalPuzzlesAttempted', columnNames: ['totalPuzzlesAttempted'] },
          { name: 'IDX_user_stats_totalPuzzlesCompleted', columnNames: ['totalPuzzlesCompleted'] },
          { name: 'IDX_user_stats_longestStreak', columnNames: ['longestStreak'] },
          { name: 'IDX_user_stats_overallAccuracy', columnNames: ['overallAccuracy'] },
          { name: 'IDX_user_stats_lastActivityAt', columnNames: ['lastActivityAt'] },
          { name: 'IDX_user_stats_lastCalculatedAt', columnNames: ['lastCalculatedAt'] },
          { name: 'IDX_user_stats_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_user_stats_updatedAt', columnNames: ['updatedAt'] },
        ],
      }),
      true,
    );

    // Create Puzzle Ratings table
    await queryRunner.createTable(
      new Table({
        name: 'puzzle_ratings',
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
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
          },
          {
            name: 'difficultyVote',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'review',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            default: "''",
          },
          {
            name: 'isReported',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: true,
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
        ],
        indices: [
          { name: 'IDX_puzzle_ratings_userId_puzzleId', columnNames: ['userId', 'puzzleId'], isUnique: true },
          { name: 'IDX_puzzle_ratings_puzzleId_rating', columnNames: ['puzzleId', 'rating'] },
          { name: 'IDX_puzzle_ratings_userId', columnNames: ['userId'] },
          { name: 'IDX_puzzle_ratings_isReported', columnNames: ['isReported'] },
          { name: 'IDX_puzzle_ratings_isPublic', columnNames: ['isPublic'] },
          { name: 'IDX_puzzle_ratings_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'user_stats',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'puzzle_ratings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'puzzle_ratings',
      new TableForeignKey({
        columnNames: ['puzzleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'puzzles',
        onDelete: 'CASCADE',
      }),
    );

    // Create performance indexes for complex queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_performance_lookup 
      ON users (status, role, totalScore DESC, level DESC, createdAt DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_puzzles_search 
      ON puzzles (isActive, category, difficulty, averageRating DESC, publishedAt DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_puzzle_progress_performance 
      ON puzzle_progress (userId, status, completedAt DESC, score DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_unlock_rate 
      ON achievements (isActive, category, rarity, unlockRate ASC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_analytics 
      ON game_sessions (userId, endTime DESC, totalScore DESC, puzzlesCompleted DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop performance indexes
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_game_sessions_analytics;');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_achievements_unlock_rate;');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_puzzle_progress_performance;');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_puzzles_search;');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_users_performance_lookup;');

    await queryRunner.dropTable('puzzle_ratings');
    await queryRunner.dropTable('user_stats');
  }
}
