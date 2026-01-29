import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAntiCheatTables1738147200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create cheat_violations table
    await queryRunner.createTable(
      new Table({
        name: 'cheat_violations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'playerId',
            type: 'uuid',
          },
          {
            name: 'puzzleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'violationType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'confidenceScore',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'evidence',
            type: 'jsonb',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'autoDetected',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionTaken',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'reviewedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'reviewNotes',
            type: 'text',
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
          {
            name: 'IDX_cheat_violations_playerId_createdAt',
            columnNames: ['playerId', 'createdAt'],
          },
          {
            name: 'IDX_cheat_violations_violationType_severity',
            columnNames: ['violationType', 'severity'],
          },
          {
            name: 'IDX_cheat_violations_status_createdAt',
            columnNames: ['status', 'createdAt'],
          },
          {
            name: 'IDX_cheat_violations_playerId',
            columnNames: ['playerId'],
          },
          {
            name: 'IDX_cheat_violations_puzzleId',
            columnNames: ['puzzleId'],
          },
          {
            name: 'IDX_cheat_violations_violationType',
            columnNames: ['violationType'],
          },
          {
            name: 'IDX_cheat_violations_severity',
            columnNames: ['severity'],
          },
          {
            name: 'IDX_cheat_violations_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_cheat_violations_createdAt',
            columnNames: ['createdAt'],
          },
        ],
      }),
      true,
    );

    // Create player_behavior_profiles table
    await queryRunner.createTable(
      new Table({
        name: 'player_behavior_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'playerId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'timingProfile',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'accuracyProfile',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'skillProfile',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'sessionPatterns',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'riskFactors',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'totalPuzzlesCompleted',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalViolations',
            type: 'int',
            default: 0,
          },
          {
            name: 'confirmedViolations',
            type: 'int',
            default: 0,
          },
          {
            name: 'trustScore',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 100,
          },
          {
            name: 'lastViolationAt',
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
          {
            name: 'IDX_player_behavior_profiles_playerId',
            columnNames: ['playerId'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    // Create puzzle_move_audit table
    await queryRunner.createTable(
      new Table({
        name: 'puzzle_move_audit',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'playerId',
            type: 'uuid',
          },
          {
            name: 'puzzleId',
            type: 'uuid',
          },
          {
            name: 'sessionId',
            type: 'uuid',
          },
          {
            name: 'moveData',
            type: 'jsonb',
          },
          {
            name: 'moveNumber',
            type: 'int',
          },
          {
            name: 'timeSincePreviousMove',
            type: 'int',
          },
          {
            name: 'wasValid',
            type: 'boolean',
          },
          {
            name: 'validationResult',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'behaviorMetrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'flaggedAsSuspicious',
            type: 'boolean',
            default: false,
          },
          {
            name: 'suspicionReasons',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_puzzle_move_audit_playerId_puzzleId_createdAt',
            columnNames: ['playerId', 'puzzleId', 'createdAt'],
          },
          {
            name: 'IDX_puzzle_move_audit_sessionId',
            columnNames: ['sessionId'],
          },
          {
            name: 'IDX_puzzle_move_audit_flaggedAsSuspicious_createdAt',
            columnNames: ['flaggedAsSuspicious', 'createdAt'],
          },
          {
            name: 'IDX_puzzle_move_audit_playerId',
            columnNames: ['playerId'],
          },
          {
            name: 'IDX_puzzle_move_audit_puzzleId',
            columnNames: ['puzzleId'],
          },
          {
            name: 'IDX_puzzle_move_audit_flaggedAsSuspicious',
            columnNames: ['flaggedAsSuspicious'],
          },
          {
            name: 'IDX_puzzle_move_audit_createdAt',
            columnNames: ['createdAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('puzzle_move_audit');
    await queryRunner.dropTable('player_behavior_profiles');
    await queryRunner.dropTable('cheat_violations');
  }
}
