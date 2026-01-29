import { MigrationInterface, QueryRunner } from 'typeorm';

export class createNotifications1732800000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "userId" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text,
        "meta" jsonb DEFAULT '{}',
        "variantId" varchar(50),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "notificationId" uuid NOT NULL,
        "channel" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL,
        "details" text,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "devices" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "userId" uuid NOT NULL,
        "token" varchar(255) NOT NULL,
        "platform" varchar(50),
        "meta" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "devices";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
  }
}
