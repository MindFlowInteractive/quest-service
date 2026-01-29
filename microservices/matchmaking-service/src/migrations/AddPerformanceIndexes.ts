import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite indexes for better query performance
    
    // User performance queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_status_totalScore" 
      ON "users" ("status", "totalScore" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_level_experience" 
      ON "users" ("level", "experience" DESC);
    `);

    // Puzzle discovery and filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzles_category_difficulty_rating" 
      ON "puzzles" ("category", "difficulty", "averageRating" DESC) 
      WHERE "isActive" = true AND "publishedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzles_featured_rating" 
      ON "puzzles" ("isFeatured", "averageRating" DESC) 
      WHERE "isActive" = true;
    `);

    // Progress tracking indexes
    await queryRunner.query(`  
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzle_progress_user_completion" 
      ON "puzzle_progress" ("userId", "completedAt" DESC) 
      WHERE "status" = 'completed';
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzle_progress_user_recent" 
      ON "puzzle_progress" ("userId", "updatedAt" DESC);
    `);

    // Achievement tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_user_achievements_recent_unlocks" 
      ON "user_achievements" ("unlockedAt" DESC) 
      WHERE "isUnlocked" = true;
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_achievements_unlock_rate" 
      ON "achievements" ("unlockRate" ASC, "rarity") 
      WHERE "isActive" = true;
    `);

    // Game session analytics
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_game_sessions_user_recent" 
      ON "game_sessions" ("userId", "startTime" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_game_sessions_performance" 
      ON "game_sessions" ("userId", "totalScore" DESC, "puzzlesCompleted" DESC) 
      WHERE "status" = 'completed';
    `);

    // Full-text search indexes for puzzle content
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzles_fulltext_search" 
      ON "puzzles" USING gin(to_tsvector('english', "title" || ' ' || "description"));
    `);

    // Ratings and reviews
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzle_ratings_recent_public" 
      ON "puzzle_ratings" ("puzzleId", "createdAt" DESC) 
      WHERE "isPublic" = true AND "isReported" = false;
    `);

    // JSON field indexes for frequent queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_preferences_difficulty" 
      ON "users" USING gin(("preferences"->>'difficulty'));
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_puzzles_tags_gin" 
      ON "puzzles" USING gin("tags");
    `);

    // Leaderboard queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_user_stats_leaderboard_total" 
      ON "user_stats" ("totalScore" DESC, "totalPuzzlesCompleted" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_user_stats_leaderboard_streak" 
      ON "user_stats" ("longestStreak" DESC, "currentStreak" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_user_stats_leaderboard_accuracy" 
      ON "user_stats" ("overallAccuracy" DESC, "totalPuzzlesCompleted" DESC) 
      WHERE "totalPuzzlesCompleted" >= 10;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop performance indexes
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_status_totalScore";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_level_experience";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzles_category_difficulty_rating";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzles_featured_rating";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzle_progress_user_completion";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzle_progress_user_recent";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_user_achievements_recent_unlocks";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_achievements_unlock_rate";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_game_sessions_user_recent";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_game_sessions_performance";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzles_fulltext_search";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzle_ratings_recent_public";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_preferences_difficulty";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_puzzles_tags_gin";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_user_stats_leaderboard_total";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_user_stats_leaderboard_streak";');
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "IDX_user_stats_leaderboard_accuracy";');
  }
}
