import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSchema1704067200000 implements MigrationInterface {
    name = 'CreateNotificationSchema1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create schema
        await queryRunner.createSchema('notifications', true);

        // CREATE TYPE notification_status_enum
        await queryRunner.query(`CREATE TYPE "notifications"."notifications_status_enum" AS ENUM('pending', 'sent', 'failed', 'read')`);

        // CREATE TYPE notification_channel_enum
        await queryRunner.query(`CREATE TYPE "notifications"."notifications_channels_enum" AS ENUM('websocket', 'push', 'email', 'webhook')`);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications"."notifications" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(), 
                "userId" character varying NOT NULL, 
                "type" character varying NOT NULL, 
                "content" jsonb NOT NULL, 
                "status" "notifications"."notifications_status_enum" NOT NULL DEFAULT 'pending', 
                "channels" "notifications"."notifications_channels_enum" array NOT NULL DEFAULT '{websocket}', 
                "isRead" boolean NOT NULL DEFAULT false, 
                "readAt" TIMESTAMP, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
            )
        `);

        // Create notification_templates table
        await queryRunner.query(`
            CREATE TABLE "notifications"."notification_templates" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(), 
                "name" character varying NOT NULL, 
                "subject" character varying, 
                "body" text NOT NULL, 
                "type" character varying NOT NULL, 
                "defaultVariables" jsonb, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_notification_templates_name" UNIQUE ("name"),
                CONSTRAINT "PK_notification_templates_id" PRIMARY KEY ("id")
            )
        `);

        // Create user_notification_preferences table
        await queryRunner.query(`
            CREATE TABLE "notifications"."user_notification_preferences" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(), 
                "userId" character varying NOT NULL, 
                "channel" "notifications"."notifications_channels_enum" NOT NULL, 
                "notificationType" character varying NOT NULL, 
                "isEnabled" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_user_notification_preferences_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_preferences_composite" UNIQUE ("userId", "channel", "notificationType")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notifications"."user_notification_preferences"`);
        await queryRunner.query(`DROP TABLE "notifications"."notification_templates"`);
        await queryRunner.query(`DROP TABLE "notifications"."notifications"`);
        await queryRunner.query(`DROP TYPE "notifications"."notifications_channels_enum"`);
        await queryRunner.query(`DROP TYPE "notifications"."notifications_status_enum"`);
        await queryRunner.query(`DROP SCHEMA "notifications"`);
    }

}
