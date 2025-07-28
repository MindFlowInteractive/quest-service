import { MigrationInterface, QueryRunner, Table, Index, TableForeignKey } from 'typeorm';

export class CreateGameDatabaseSchema implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create Users table (enhanced)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'role',
            type: 'varchar',
            length: '20',
            default: "'player'",
          },
          {
            name: 'totalScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'level',
            type: 'int',
            default: 1,
          },
          {
            name: 'experience',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzlesSolved',
            type: 'int',
            default: 0,
          },
          {
            name: 'achievementsCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastActiveAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'profile',
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
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        indices: [
          { name: 'IDX_users_email', columnNames: ['email'], isUnique: true },
          { name: 'IDX_users_username', columnNames: ['username'], isUnique: true },
          { name: 'IDX_users_status', columnNames: ['status'] },
          { name: 'IDX_users_role', columnNames: ['role'] },
          { name: 'IDX_users_totalScore', columnNames: ['totalScore'] },
          { name: 'IDX_users_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_users_updatedAt', columnNames: ['updatedAt'] },
        ],
      }),
      true,
    );

    // Create Puzzle Categories table
    await queryRunner.createTable(
      new Table({
        name: 'puzzle_categories',
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
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'iconUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            default: "'#000000'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'puzzleCount',
            type: 'int',
            default: 0,
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
          { name: 'IDX_puzzle_categories_slug', columnNames: ['slug'], isUnique: true },
          { name: 'IDX_puzzle_categories_name', columnNames: ['name'] },
          { name: 'IDX_puzzle_categories_isActive', columnNames: ['isActive'] },
          { name: 'IDX_puzzle_categories_sortOrder', columnNames: ['sortOrder'] },
          { name: 'IDX_puzzle_categories_puzzleCount', columnNames: ['puzzleCount'] },
          { name: 'IDX_puzzle_categories_createdAt', columnNames: ['createdAt'] },
        ],
      }),
      true,
    );

    // Create Puzzles table
    await queryRunner.createTable(
      new Table({
        name: 'puzzles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
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
            name: 'difficulty',
            type: 'varchar',
            length: '20',
            default: "'medium'",
          },
          {
            name: 'difficultyRating',
            type: 'int',
            default: 1,
          },
          {
            name: 'basePoints',
            type: 'int',
            default: 100,
          },
          {
            name: 'timeLimit',
            type: 'int',
            default: 300,
          },
          {
            name: 'maxHints',
            type: 'int',
            default: 3,
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'completions',
            type: 'int',
            default: 0,
          },
          {
            name: 'averageRating',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'ratingCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'averageCompletionTime',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isFeatured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'publishedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'parentPuzzleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'jsonb',
          },
          {
            name: 'hints',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'tags',
            type: 'text',
            default: "''",
          },
          {
            name: 'prerequisites',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'scoring',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'analytics',
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
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        indices: [
          { name: 'IDX_puzzles_title', columnNames: ['title'] },
          { name: 'IDX_puzzles_category_difficulty', columnNames: ['category', 'difficulty'] },
          { name: 'IDX_puzzles_isActive_publishedAt', columnNames: ['isActive', 'publishedAt'] },
          { name: 'IDX_puzzles_createdBy', columnNames: ['createdBy'] },
          { name: 'IDX_puzzles_difficultyRating', columnNames: ['difficultyRating'] },
          { name: 'IDX_puzzles_attempts', columnNames: ['attempts'] },
          { name: 'IDX_puzzles_completions', columnNames: ['completions'] },
          { name: 'IDX_puzzles_averageRating', columnNames: ['averageRating'] },
          { name: 'IDX_puzzles_isFeatured', columnNames: ['isFeatured'] },
          { name: 'IDX_puzzles_publishedAt', columnNames: ['publishedAt'] },
          { name: 'IDX_puzzles_createdAt', columnNames: ['createdAt'] },
          { name: 'IDX_puzzles_updatedAt', columnNames: ['updatedAt'] },
        ],
      }),
      true,
    );

    // Add foreign key for parent puzzle relationship
    await queryRunner.createForeignKey(
      'puzzles',
      new TableForeignKey({
        columnNames: ['parentPuzzleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'puzzles',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for puzzle creator
    await queryRunner.createForeignKey(
      'puzzles',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('puzzles');
    await queryRunner.dropTable('puzzle_categories');
    await queryRunner.dropTable('users');
  }
}
