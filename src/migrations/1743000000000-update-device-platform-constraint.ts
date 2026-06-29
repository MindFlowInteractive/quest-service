import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDevicePlatformConstraint1743000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE devices SET platform = 'web' WHERE platform IS NULL`);
    await queryRunner.query(`ALTER TABLE devices ALTER COLUMN platform SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE devices ALTER COLUMN platform SET DEFAULT 'web'`);
    await queryRunner.query(
      `ALTER TABLE devices ADD CONSTRAINT chk_device_platform CHECK (platform IN ('ios', 'android', 'web'))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_token_unique ON devices (token)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_devices_token_unique`);
    await queryRunner.query(`ALTER TABLE devices DROP CONSTRAINT IF EXISTS chk_device_platform`);
    await queryRunner.query(`ALTER TABLE devices ALTER COLUMN platform DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE devices ALTER COLUMN platform DROP DEFAULT`);
  }
}
