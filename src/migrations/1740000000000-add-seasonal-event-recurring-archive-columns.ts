import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds archiving and recurring-event columns to the seasonal_events table.
 *
 * New columns:
 *   - isArchived        BOOLEAN  NOT NULL DEFAULT false
 *   - archivedAt        TIMESTAMPTZ NULL
 *   - isRecurring       BOOLEAN  NOT NULL DEFAULT false
 *   - recurrenceConfig  JSONB    NULL
 */
export class AddSeasonalEventRecurringArchiveColumns1740000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('seasonal_events', [
      new TableColumn({
        name: 'isArchived',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'archivedAt',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'isRecurring',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'recurrenceConfig',
        type: 'jsonb',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('seasonal_events', 'recurrenceConfig');
    await queryRunner.dropColumn('seasonal_events', 'isRecurring');
    await queryRunner.dropColumn('seasonal_events', 'archivedAt');
    await queryRunner.dropColumn('seasonal_events', 'isArchived');
  }
}
