import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRecommendationTables1704067200000 implements MigrationInterface {
  name = 'CreateRecommendationTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_preferences table
    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
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
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'preferenceScore',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.5,
          },
          {
            name: 'difficulty',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'difficultyScore',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.5,
          },
          {
            name: 'tagPreferences',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'interactionCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'averageCompletionTime',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
          },
          {
            name: 'successRate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create user_interactions table
    await queryRunner.createTable(
      new Table({
        name: 'user_interactions',
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
            isNullable: false,
          },
          {
            name: 'puzzleId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'interactionType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['puzzleId'],
            referencedTableName: 'puzzles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create recommendations table
    await queryRunner.createTable(
      new Table({
        name: 'recommendations',
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
            isNullable: false,
          },
          {
            name: 'puzzleId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'algorithm',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'score',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'wasViewed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'wasClicked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'wasCompleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'viewedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'clickedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['puzzleId'],
            referencedTableName: 'puzzles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for user_preferences
    await queryRunner.createIndex(
      'user_preferences',
      new TableIndex({ name: 'IDX_user_preferences_userId', columnNames: ['userId'] }),
    );

    // Create indexes for user_interactions
    await queryRunner.createIndex(
      'user_interactions',
      new TableIndex({ name: 'IDX_user_interactions_userId_puzzleId', columnNames: ['userId', 'puzzleId'] }),
    );
    await queryRunner.createIndex(
      'user_interactions',
      new TableIndex({ name: 'IDX_user_interactions_userId_type_createdAt', columnNames: ['userId', 'interactionType', 'createdAt'] }),
    );

    // Create indexes for recommendations
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_userId_puzzleId', columnNames: ['userId', 'puzzleId'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_userId_createdAt', columnNames: ['userId', 'createdAt'] }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_algorithm_createdAt', columnNames: ['algorithm', 'createdAt'] }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_score', columnNames: ['score'] }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_wasViewed', columnNames: ['wasViewed'] }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_wasClicked', columnNames: ['wasClicked'] }),
    );
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({ name: 'IDX_recommendations_wasCompleted', columnNames: ['wasCompleted'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recommendations');
    await queryRunner.dropTable('user_interactions');
    await queryRunner.dropTable('user_preferences');
  }
}