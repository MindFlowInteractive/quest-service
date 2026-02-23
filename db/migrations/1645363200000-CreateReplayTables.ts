import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReplayTables1645363200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create puzzle_replays table
    await queryRunner.createTable(
      new Table({
        name: 'puzzle_replays',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
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
            name: 'gameSessionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'puzzleTitle',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'puzzleCategory',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'puzzleDifficulty',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'isCompleted',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'completedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'isSolved',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'totalDuration',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'activeTime',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'pausedTime',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'movesCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'hintsUsed',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'undosCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'stateChanges',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'scoreEarned',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'maxScorePossible',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'efficiency',
            type: 'numeric',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'initialState',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'finalState',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'userMetadata',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'sessionMetadata',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '20',
            default: "'private'",
            isNullable: false,
          },
          {
            name: 'shareCode',
            type: 'varchar',
            length: '50',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'shareExpiredAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'viewCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'isCompressed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'storageSize',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'archiveStatus',
            type: 'varchar',
            length: '50',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'lastViewedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        indices: [
          new TableIndex({ columnNames: ['userId'] }),
          new TableIndex({ columnNames: ['puzzleId'] }),
          new TableIndex({ columnNames: ['userId', 'puzzleId'] }),
          new TableIndex({ columnNames: ['userId', 'createdAt'] }),
          new TableIndex({ columnNames: ['puzzleId', 'isCompleted'] }),
          new TableIndex({ columnNames: ['shareCode'] }),
        ],
      }),
    );

    // Create replay_actions table
    await queryRunner.createTable(
      new Table({
        name: 'replay_actions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'replayId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sequenceNumber',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'actionType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'recordedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'actionData',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'stateBefore',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'stateAfter',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
        ],
        indices: [
          new TableIndex({ columnNames: ['replayId'] }),
          new TableIndex({ columnNames: ['replayId', 'sequenceNumber'] }),
          new TableIndex({ columnNames: ['replayId', 'timestamp'] }),
        ],
        foreignKeys: [
          {
            columnNames: ['replayId'],
            referencedTableName: 'puzzle_replays',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Create replay_analytics table
    await queryRunner.createTable(
      new Table({
        name: 'replay_analytics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'replayId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'metricType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'metricValue',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'recordedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          new TableIndex({ columnNames: ['replayId'] }),
          new TableIndex({ columnNames: ['replayId', 'metricType'] }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('replay_analytics');
    await queryRunner.dropTable('replay_actions');
    await queryRunner.dropTable('puzzle_replays');
  }
}
