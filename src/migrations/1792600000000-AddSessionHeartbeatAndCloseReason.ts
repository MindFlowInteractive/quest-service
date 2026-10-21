import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSessionHeartbeatAndCloseReason1792600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('game_sessions');
    if (!table) return;

    if (!table.findColumnByName('lastHeartbeatAt')) {
      await queryRunner.addColumn(
        'game_sessions',
        new TableColumn({
          name: 'lastHeartbeatAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
    await queryRunner.query(
      'UPDATE "game_sessions" SET "lastHeartbeatAt" = "lastActiveAt" WHERE "lastHeartbeatAt" IS NULL',
    );

    if (!table.findColumnByName('closeReason')) {
      await queryRunner.addColumn(
        'game_sessions',
        new TableColumn({
          name: 'closeReason',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('game_sessions');
    if (!table) return;

    if (table.findColumnByName('closeReason')) {
      await queryRunner.dropColumn('game_sessions', 'closeReason');
    }
    if (table.findColumnByName('lastHeartbeatAt')) {
      await queryRunner.dropColumn('game_sessions', 'lastHeartbeatAt');
    }
  }
}
