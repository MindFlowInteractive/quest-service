import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateQuestChainTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quest_chains table
    await queryRunner.createTable(
      new Table({
        name: 'quest_chains',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'story',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'rewards',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'completionCount',
            type: 'int',
            default: '0',
          },
          {
            name: 'startsAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'endsAt',
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
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for quest_chains
    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_status_createdAt',
        columnNames: ['status', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_startsAt',
        columnNames: ['startsAt'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chains',
      new TableIndex({
        name: 'IDX_quest_chains_endsAt',
        columnNames: ['endsAt'],
      }),
    );

    // Create quest_chain_puzzles table
    await queryRunner.createTable(
      new Table({
        name: 'quest_chain_puzzles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'questChainId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'puzzleId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sequenceOrder',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'unlockConditions',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'branchConditions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'isCheckpoint',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'checkpointRewards',
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
      }),
      true,
    );

    // Create indexes for quest_chain_puzzles
    await queryRunner.createIndex(
      'quest_chain_puzzles',
      new TableIndex({
        name: 'IDX_quest_chain_puzzles_questChainId',
        columnNames: ['questChainId'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chain_puzzles',
      new TableIndex({
        name: 'IDX_quest_chain_puzzles_puzzleId',
        columnNames: ['puzzleId'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chain_puzzles',
      new TableIndex({
        name: 'IDX_quest_chain_puzzles_sequenceOrder',
        columnNames: ['sequenceOrder'],
      }),
    );

    await queryRunner.createIndex(
      'quest_chain_puzzles',
      new TableIndex({
        name: 'IDX_quest_chain_puzzles_questChainId_sequenceOrder',
        columnNames: ['questChainId', 'sequenceOrder'],
      }),
    );

    // Create user_quest_chain_progress table
    await queryRunner.createTable(
      new Table({
        name: 'user_quest_chain_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'questChainId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'not_started'",
          },
          {
            name: 'currentPuzzleIndex',
            type: 'int',
            default: '0',
          },
          {
            name: 'completedPuzzleIds',
            type: 'simple-array',
            default: "''",
          },
          {
            name: 'checkpointData',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'branchPath',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'totalScore',
            type: 'int',
            default: '0',
          },
          {
            name: 'totalTime',
            type: 'int',
            default: '0',
          },
          {
            name: 'totalHintsUsed',
            type: 'int',
            default: '0',
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
            name: 'lastPlayedAt',
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
      }),
      true,
    );

    // Create indexes for user_quest_chain_progress
    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_questChainId',
        columnNames: ['questChainId'],
      }),
    );

    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_userId_questChainId',
        columnNames: ['userId', 'questChainId'],
      }),
    );

    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_userId_status',
        columnNames: ['userId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'user_quest_chain_progress',
      new TableIndex({
        name: 'IDX_user_quest_chain_progress_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'quest_chain_puzzles',
      new TableForeignKey({
        columnNames: ['questChainId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quest_chains',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'quest_chain_puzzles',
      new TableForeignKey({
        columnNames: ['puzzleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'puzzles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_quest_chain_progress',
      new TableForeignKey({
        columnNames: ['questChainId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quest_chains',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_quest_chain_progress',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    const tableNames = ['quest_chain_puzzles', 'user_quest_chain_progress'];
    for (const tableName of tableNames) {
      const table = await queryRunner.getTable(tableName);
      if (table) {
        const foreignKeys = table.foreignKeys;
        for (const foreignKey of foreignKeys) {
          await queryRunner.dropForeignKey(tableName, foreignKey);
        }
      }
    }

    // Drop tables
    await queryRunner.dropTable('user_quest_chain_progress');
    await queryRunner.dropTable('quest_chain_puzzles');
    await queryRunner.dropTable('quest_chains');
  }
}