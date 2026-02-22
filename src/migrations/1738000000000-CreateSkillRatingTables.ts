import { MigrationInterface, QueryRunner, Table, Index, TableForeignKey } from 'typeorm';

export class CreateSkillRatingTables1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Seasons table
    await queryRunner.createTable(
      new Table({
        name: 'seasons',
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
            name: 'seasonId',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'upcoming'",
          },
          {
            name: 'startDate',
            type: 'timestamp with time zone',
          },
          {
            name: 'endDate',
            type: 'timestamp with time zone',
          },
          {
            name: 'requiresReset',
            type: 'boolean',
            default: false,
          },
          {
            name: 'defaultRating',
            type: 'int',
            default: 1200,
          },
          {
            name: 'config',
            type: 'jsonb',
            default: "'{}'",
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
          { name: 'IDX_seasons_status', columnNames: ['status'] },
          { name: 'IDX_seasons_dates', columnNames: ['startDate', 'endDate'] },
          { name: 'IDX_seasons_seasonId', columnNames: ['seasonId'] },
          { name: 'IDX_seasons_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create Player Ratings table
    await queryRunner.createTable(
      new Table({
        name: 'player_ratings',
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
            name: 'rating',
            type: 'int',
            default: 1200,
          },
          {
            name: 'ratingDeviation',
            type: 'int',
            default: 0,
          },
          {
            name: 'tier',
            type: 'varchar',
            length: '20',
            default: "'bronze'",
          },
          {
            name: 'seasonId',
            type: 'varchar',
            length: '50',
            default: "'Season 1'",
          },
          {
            name: 'seasonStatus',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'gamesPlayed',
            type: 'int',
            default: 0,
          },
          {
            name: 'wins',
            type: 'int',
            default: 0,
          },
          {
            name: 'losses',
            type: 'int',
            default: 0,
          },
          {
            name: 'draws',
            type: 'int',
            default: 0,
          },
          {
            name: 'streak',
            type: 'int',
            default: 0,
          },
          {
            name: 'bestStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastPlayedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastRatingUpdate',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'winRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'statistics',
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
          { name: 'IDX_player_ratings_user_season', columnNames: ['userId', 'seasonId'] },
          { name: 'IDX_player_ratings_rating', columnNames: ['rating'] },
          { name: 'IDX_player_ratings_tier', columnNames: ['tier'] },
          { name: 'IDX_player_ratings_seasonId', columnNames: ['seasonId'] },
          { name: 'IDX_player_ratings_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create Rating History table
    await queryRunner.createTable(
      new Table({
        name: 'rating_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'playerRatingId',
            type: 'uuid',
          },
          {
            name: 'oldRating',
            type: 'int',
          },
          {
            name: 'newRating',
            type: 'int',
          },
          {
            name: 'ratingChange',
            type: 'int',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '30',
            default: "'puzzle_completed'",
          },
          {
            name: 'puzzleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'puzzleDifficulty',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'timeTaken',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'hintsUsed',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'attempts',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'wasCompleted',
            type: 'boolean',
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
        ],
        indices: [
          { name: 'IDX_rating_history_player_rating', columnNames: ['playerRatingId', 'createdAt'] },
          { name: 'IDX_rating_history_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_rating_history_reason', columnNames: ['reason'] },
          { name: 'IDX_rating_history_puzzleId', columnNames: ['puzzleId'] },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'player_ratings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_history',
      new TableForeignKey({
        columnNames: ['playerRatingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'player_ratings',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_history',
      new TableForeignKey({
        columnNames: ['puzzleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'puzzles',
        onDelete: 'SET NULL',
      }),
    );

    // Insert initial season
    await queryRunner.query(`
      INSERT INTO seasons (name, seasonId, status, startDate, endDate, requiresReset, defaultRating, config)
      VALUES (
        'Season 1',
        'S001',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '3 months',
        true,
        1200,
        '{"decayEnabled": true, "decayPeriodDays": 30, "decayAmount": 2, "minRating": 100, "kFactor": 32, "tierThresholds": {"bronze": 1200, "silver": 1400, "gold": 1600, "platinum": 1800, "diamond": 2000, "master": 2400}}'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('rating_history');
    await queryRunner.dropTable('player_ratings');
    await queryRunner.dropTable('seasons');
  }
}
