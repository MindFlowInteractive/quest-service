import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhancePlayerProfileSchema1703000000000 implements MigrationInterface {
  name = 'EnhancePlayerProfileSchema1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to player_profiles table
    await queryRunner.query(`
      ALTER TABLE "player_profiles" 
      ADD COLUMN "bannerUrl" varchar(500),
      ADD COLUMN "title" varchar(100),
      ADD COLUMN "location" varchar(50),
      ADD COLUMN "website" varchar(200),
      ADD COLUMN "customFields" jsonb DEFAULT '{}',
      ADD COLUMN "socialLinks" jsonb DEFAULT '{}',
      ADD COLUMN "displayPreferences" jsonb DEFAULT '{}',
      ADD COLUMN "statistics" jsonb DEFAULT '{}'
    `);

    // Update existing privacySettings to include new fields
    await queryRunner.query(`
      UPDATE "player_profiles" 
      SET "privacySettings" = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE("privacySettings", '{}'),
              '{showStats}', 'true'
            ),
            '{showSocialLinks}', 'true'
          ),
          '{showLocation}', 'true'
        ),
        '{showWebsite}', 'true'
      )
      WHERE "privacySettings" IS NOT NULL
    `);

    // Set default privacy settings for profiles without them
    await queryRunner.query(`
      UPDATE "player_profiles" 
      SET "privacySettings" = '{
        "isProfilePublic": true,
        "showBadges": true,
        "showBio": true,
        "showStats": true,
        "showSocialLinks": true,
        "showLocation": true,
        "showWebsite": true
      }'
      WHERE "privacySettings" IS NULL
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_player_profiles_statistics_total_games" 
      ON "player_profiles" USING gin (("statistics"->>'totalGamesPlayed'))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_player_profiles_statistics_win_rate" 
      ON "player_profiles" USING gin (("statistics"->>'winRate'))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_player_profiles_privacy_public" 
      ON "player_profiles" USING gin (("privacySettings"->>'isProfilePublic'))
    `);

    // Create index for custom fields search
    await queryRunner.query(`
      CREATE INDEX "IDX_player_profiles_custom_fields" 
      ON "player_profiles" USING gin ("customFields")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_player_profiles_custom_fields"`);
    await queryRunner.query(`DROP INDEX "IDX_player_profiles_privacy_public"`);
    await queryRunner.query(`DROP INDEX "IDX_player_profiles_statistics_win_rate"`);
    await queryRunner.query(`DROP INDEX "IDX_player_profiles_statistics_total_games"`);

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE "player_profiles" 
      DROP COLUMN "statistics",
      DROP COLUMN "displayPreferences",
      DROP COLUMN "socialLinks",
      DROP COLUMN "customFields",
      DROP COLUMN "website",
      DROP COLUMN "location",
      DROP COLUMN "title",
      DROP COLUMN "bannerUrl"
    `);

    // Revert privacy settings to original structure
    await queryRunner.query(`
      UPDATE "player_profiles" 
      SET "privacySettings" = jsonb_build_object(
        'isProfilePublic', COALESCE("privacySettings"->>'isProfilePublic', 'true')::boolean,
        'showBadges', COALESCE("privacySettings"->>'showBadges', 'true')::boolean,
        'showBio', COALESCE("privacySettings"->>'showBio', 'true')::boolean
      )
    `);
  }
}