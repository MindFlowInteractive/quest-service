import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePracticeModeTables1760900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'practice_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'playerId', type: 'uuid' },
          { name: 'puzzleId', type: 'varchar', length: '255' },
          { name: 'puzzleType', type: 'varchar', length: '50' },
          { name: 'difficulty', type: 'integer' },
          { name: 'content', type: 'jsonb' },
          { name: 'solution', type: 'jsonb' },
          { name: 'hints', type: 'jsonb', default: "'[]'::jsonb" },
          { name: 'solutionGuide', type: 'varchar', isNullable: true },
          { name: 'attemptsCount', type: 'integer', default: 0 },
          { name: 'correctAttempts', type: 'integer', default: 0 },
          { name: 'hintsRequested', type: 'integer', default: 0 },
          { name: 'replays', type: 'integer', default: 0 },
          { name: 'totalTimeSpent', type: 'integer', default: 0 },
          { name: 'completed', type: 'boolean', default: false },
          { name: 'startedAt', type: 'timestamptz' },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'practice_sessions',
      new TableIndex({
        name: 'IDX_practice_sessions_playerId',
        columnNames: ['playerId'],
      }),
    );
    await queryRunner.createIndex(
      'practice_sessions',
      new TableIndex({
        name: 'IDX_practice_sessions_puzzleId',
        columnNames: ['puzzleId'],
      }),
    );
    await queryRunner.createIndex(
      'practice_sessions',
      new TableIndex({
        name: 'IDX_practice_sessions_playerId_updatedAt',
        columnNames: ['playerId', 'updatedAt'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'practice_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'practiceSessionId', type: 'uuid' },
          { name: 'isCorrect', type: 'boolean' },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['practiceSessionId'],
            referencedTableName: 'practice_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'practice_attempts',
      new TableIndex({
        name: 'IDX_practice_attempts_practiceSessionId',
        columnNames: ['practiceSessionId'],
      }),
    );
    await queryRunner.createIndex(
      'practice_attempts',
      new TableIndex({
        name: 'IDX_practice_attempts_session_createdAt',
        columnNames: ['practiceSessionId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('practice_attempts');
    await queryRunner.dropTable('practice_sessions');
  }
}
