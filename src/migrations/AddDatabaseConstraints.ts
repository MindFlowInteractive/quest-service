import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseConstraints implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // User constraints
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "CHK_users_email_format" 
      CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "CHK_users_status_valid" 
      CHECK ("status" IN ('active', 'inactive', 'suspended', 'deleted'));
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "CHK_users_role_valid" 
      CHECK ("role" IN ('player', 'admin', 'moderator'));
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "CHK_users_positive_scores" 
      CHECK ("totalScore" >= 0 AND "level" >= 1 AND "experience" >= 0 AND "puzzlesSolved" >= 0 AND "achievementsCount" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "CHK_users_username_length" 
      CHECK (length("username") >= 3 AND length("username") <= 30);
    `);

    // Puzzle constraints
    await queryRunner.query(`
      ALTER TABLE "puzzles" 
      ADD CONSTRAINT "CHK_puzzles_difficulty_valid" 
      CHECK ("difficulty" IN ('easy', 'medium', 'hard', 'expert'));
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzles" 
      ADD CONSTRAINT "CHK_puzzles_difficulty_rating_range" 
      CHECK ("difficultyRating" >= 1 AND "difficultyRating" <= 10);
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzles" 
      ADD CONSTRAINT "CHK_puzzles_positive_values" 
      CHECK ("basePoints" > 0 AND "timeLimit" > 0 AND "maxHints" >= 0 AND "attempts" >= 0 AND "completions" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzles" 
      ADD CONSTRAINT "CHK_puzzles_rating_range" 
      CHECK ("averageRating" >= 0 AND "averageRating" <= 5 AND "ratingCount" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzles" 
      ADD CONSTRAINT "CHK_puzzles_title_length" 
      CHECK (length(trim("title")) >= 5);
    `);

    // Achievement constraints
    await queryRunner.query(`
      ALTER TABLE "achievements" 
      ADD CONSTRAINT "CHK_achievements_rarity_valid" 
      CHECK ("rarity" IN ('common', 'rare', 'epic', 'legendary'));
    `);

    await queryRunner.query(`
      ALTER TABLE "achievements" 
      ADD CONSTRAINT "CHK_achievements_positive_values" 
      CHECK ("points" > 0 AND "unlockedCount" >= 0 AND "unlockRate" >= 0 AND "unlockRate" <= 100);
    `);

    await queryRunner.query(`
      ALTER TABLE "achievements" 
      ADD CONSTRAINT "CHK_achievements_name_length" 
      CHECK (length(trim("name")) >= 3);
    `);

    // User Achievement constraints
    await queryRunner.query(`
      ALTER TABLE "user_achievements" 
      ADD CONSTRAINT "CHK_user_achievements_progress_valid" 
      CHECK ("progress" >= 0 AND "progressTotal" > 0 AND "progress" <= "progressTotal");
    `);

    await queryRunner.query(`
      ALTER TABLE "user_achievements" 
      ADD CONSTRAINT "CHK_user_achievements_unlock_logic" 
      CHECK (
        ("isUnlocked" = false AND "unlockedAt" IS NULL) OR 
        ("isUnlocked" = true AND "unlockedAt" IS NOT NULL)
      );
    `);

    // Puzzle Progress constraints
    await queryRunner.query(`
      ALTER TABLE "puzzle_progress" 
      ADD CONSTRAINT "CHK_puzzle_progress_status_valid" 
      CHECK ("status" IN ('not_started', 'in_progress', 'completed', 'failed', 'skipped'));
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_progress" 
      ADD CONSTRAINT "CHK_puzzle_progress_positive_values" 
      CHECK ("attempts" >= 0 AND "score" >= 0 AND "bestScore" >= 0 AND "hintsUsed" >= 0 AND "timeSpent" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_progress" 
      ADD CONSTRAINT "CHK_puzzle_progress_best_score_logic" 
      CHECK ("bestScore" >= "score");
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_progress" 
      ADD CONSTRAINT "CHK_puzzle_progress_completion_logic" 
      CHECK (
        ("status" != 'completed' AND "completedAt" IS NULL) OR 
        ("status" = 'completed' AND "completedAt" IS NOT NULL)
      );
    `);

    // Game Session constraints
    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_platform_valid" 
      CHECK ("platform" IN ('web', 'mobile', 'tablet', 'desktop'));
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_status_valid" 
      CHECK ("status" IN ('ongoing', 'completed', 'abandoned', 'paused', 'error'));
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_positive_values" 
      CHECK (
        "duration" >= 0 AND "puzzlesAttempted" >= 0 AND "puzzlesCompleted" >= 0 AND 
        "puzzlesFailed" >= 0 AND "puzzlesSkipped" >= 0 AND "totalScore" >= 0 AND 
        "totalHintsUsed" >= 0 AND "achievementsUnlocked" >= 0 AND "longestStreak" >= 0
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_puzzle_logic" 
      CHECK ("puzzlesCompleted" + "puzzlesFailed" + "puzzlesSkipped" <= "puzzlesAttempted");
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_time_logic" 
      CHECK ("endTime" IS NULL OR "endTime" >= "startTime");
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions" 
      ADD CONSTRAINT "CHK_game_sessions_accuracy_range" 
      CHECK ("averageAccuracy" >= 0 AND "averageAccuracy" <= 100);
    `);

    // Puzzle Rating constraints
    await queryRunner.query(`
      ALTER TABLE "puzzle_ratings" 
      ADD CONSTRAINT "CHK_puzzle_ratings_rating_range" 
      CHECK ("rating" >= 1.00 AND "rating" <= 5.00);
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_ratings" 
      ADD CONSTRAINT "CHK_puzzle_ratings_difficulty_vote_valid" 
      CHECK ("difficultyVote" IS NULL OR "difficultyVote" IN ('easy', 'medium', 'hard', 'expert'));
    `);

    // User Stats constraints
    await queryRunner.query(`
      ALTER TABLE "user_stats" 
      ADD CONSTRAINT "CHK_user_stats_positive_values" 
      CHECK (
        "totalPuzzlesAttempted" >= 0 AND "totalPuzzlesCompleted" >= 0 AND 
        "totalPuzzlesFailed" >= 0 AND "totalScore" >= 0 AND "totalTimeSpent" >= 0 AND 
        "totalHintsUsed" >= 0 AND "currentStreak" >= 0 AND "longestStreak" >= 0 AND 
        "totalAchievements" >= 0 AND "totalGameSessions" >= 0
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "user_stats" 
      ADD CONSTRAINT "CHK_user_stats_puzzle_logic" 
      CHECK ("totalPuzzlesCompleted" + "totalPuzzlesFailed" <= "totalPuzzlesAttempted");
    `);

    await queryRunner.query(`
      ALTER TABLE "user_stats" 
      ADD CONSTRAINT "CHK_user_stats_accuracy_range" 
      CHECK ("overallAccuracy" >= 0 AND "overallAccuracy" <= 100);
    `);

    await queryRunner.query(`
      ALTER TABLE "user_stats" 
      ADD CONSTRAINT "CHK_user_stats_streak_logic" 
      CHECK ("longestStreak" >= "currentStreak");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all constraints
    await queryRunner.query('ALTER TABLE "user_stats" DROP CONSTRAINT IF EXISTS "CHK_user_stats_streak_logic";');
    await queryRunner.query('ALTER TABLE "user_stats" DROP CONSTRAINT IF EXISTS "CHK_user_stats_accuracy_range";');
    await queryRunner.query('ALTER TABLE "user_stats" DROP CONSTRAINT IF EXISTS "CHK_user_stats_puzzle_logic";');
    await queryRunner.query('ALTER TABLE "user_stats" DROP CONSTRAINT IF EXISTS "CHK_user_stats_positive_values";');
    
    await queryRunner.query('ALTER TABLE "puzzle_ratings" DROP CONSTRAINT IF EXISTS "CHK_puzzle_ratings_difficulty_vote_valid";');
    await queryRunner.query('ALTER TABLE "puzzle_ratings" DROP CONSTRAINT IF EXISTS "CHK_puzzle_ratings_rating_range";');
    
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_accuracy_range";');
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_time_logic";');
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_puzzle_logic";');
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_positive_values";');
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_status_valid";');
    await queryRunner.query('ALTER TABLE "game_sessions" DROP CONSTRAINT IF EXISTS "CHK_game_sessions_platform_valid";');
    
    await queryRunner.query('ALTER TABLE "puzzle_progress" DROP CONSTRAINT IF EXISTS "CHK_puzzle_progress_completion_logic";');
    await queryRunner.query('ALTER TABLE "puzzle_progress" DROP CONSTRAINT IF EXISTS "CHK_puzzle_progress_best_score_logic";');
    await queryRunner.query('ALTER TABLE "puzzle_progress" DROP CONSTRAINT IF EXISTS "CHK_puzzle_progress_positive_values";');
    await queryRunner.query('ALTER TABLE "puzzle_progress" DROP CONSTRAINT IF EXISTS "CHK_puzzle_progress_status_valid";');
    
    await queryRunner.query('ALTER TABLE "user_achievements" DROP CONSTRAINT IF EXISTS "CHK_user_achievements_unlock_logic";');
    await queryRunner.query('ALTER TABLE "user_achievements" DROP CONSTRAINT IF EXISTS "CHK_user_achievements_progress_valid";');
    
    await queryRunner.query('ALTER TABLE "achievements" DROP CONSTRAINT IF EXISTS "CHK_achievements_name_length";');
    await queryRunner.query('ALTER TABLE "achievements" DROP CONSTRAINT IF EXISTS "CHK_achievements_positive_values";');
    await queryRunner.query('ALTER TABLE "achievements" DROP CONSTRAINT IF EXISTS "CHK_achievements_rarity_valid";');
    
    await queryRunner.query('ALTER TABLE "puzzles" DROP CONSTRAINT IF EXISTS "CHK_puzzles_title_length";');
    await queryRunner.query('ALTER TABLE "puzzles" DROP CONSTRAINT IF EXISTS "CHK_puzzles_rating_range";');
    await queryRunner.query('ALTER TABLE "puzzles" DROP CONSTRAINT IF EXISTS "CHK_puzzles_positive_values";');
    await queryRunner.query('ALTER TABLE "puzzles" DROP CONSTRAINT IF EXISTS "CHK_puzzles_difficulty_rating_range";');
    await queryRunner.query('ALTER TABLE "puzzles" DROP CONSTRAINT IF EXISTS "CHK_puzzles_difficulty_valid";');
    
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_username_length";');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_positive_scores";');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_role_valid";');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_status_valid";');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_email_format";');
  }
}
