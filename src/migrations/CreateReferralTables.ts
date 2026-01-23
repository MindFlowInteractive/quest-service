import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  Index,
} from 'typeorm';

export class CreateReferralTables1733000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create referral_codes table
    await queryRunner.createTable(
      new Table({
        name: 'referral_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'totalReferrals',
            type: 'int',
            default: 0,
          },
          {
            name: 'activeReferrals',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalRewardsEarned',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expiresAt',
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
            name: 'IDX_referral_codes_code',
            columnNames: ['code'],
            isUnique: true,
          },
          {
            name: 'IDX_referral_codes_userId',
            columnNames: ['userId'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    // Create referrals table
    await queryRunner.createTable(
      new Table({
        name: 'referrals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referrerId',
            type: 'uuid',
          },
          {
            name: 'refereeId',
            type: 'uuid',
          },
          {
            name: 'referralCodeId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'referrerReward',
            type: 'int',
            default: 0,
          },
          {
            name: 'refereeReward',
            type: 'int',
            default: 0,
          },
          {
            name: 'referrerRewarded',
            type: 'boolean',
            default: false,
          },
          {
            name: 'refereeRewarded',
            type: 'boolean',
            default: false,
          },
          {
            name: 'referrerRewardedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'refereeRewardedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp with time zone',
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
        ],
        indices: [
          {
            name: 'IDX_referrals_referrerId_refereeId',
            columnNames: ['referrerId', 'refereeId'],
            isUnique: true,
          },
          {
            name: 'IDX_referrals_referralCodeId',
            columnNames: ['referralCodeId'],
          },
          {
            name: 'IDX_referrals_refereeId',
            columnNames: ['refereeId'],
          },
          {
            name: 'IDX_referrals_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_referrals_createdAt',
            columnNames: ['createdAt'],
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'referral_codes',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['referrerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['refereeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['referralCodeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'referral_codes',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const referralCodesTable = await queryRunner.getTable('referral_codes');
    const referralsTable = await queryRunner.getTable('referrals');

    if (referralsTable) {
      const foreignKeys = referralsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('referrals', fk);
      }
    }

    if (referralCodesTable) {
      const foreignKeys = referralCodesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('referral_codes', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('referrals', true);
    await queryRunner.dropTable('referral_codes', true);
  }
}
