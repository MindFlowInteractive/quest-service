import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimeAttackMode1792512000000 implements MigrationInterface {
  name = 'AddTimeAttackMode1792512000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_quest_chain_progress" ADD COLUMN "mode" varchar(20) NOT NULL DEFAULT 'standard'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quest_chain_progress" ADD COLUMN "deadlineAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_quest_chain_progress" DROP COLUMN "deadlineAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quest_chain_progress" DROP COLUMN "mode"`,
    );
  }
}
