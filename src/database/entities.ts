// Central export file for all database entities
// This ensures proper loading order and avoids circular dependency issues

export { User } from '../users/entities/user.entity';
export { UserStats } from '../users/entities/user-stats.entity';
export { Puzzle } from '../puzzles/entities/puzzle.entity';
export { PuzzleCategory } from '../puzzles/entities/puzzle-category.entity';
export { PuzzleRating } from '../puzzles/entities/puzzle-rating.entity';
export { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
export { Achievement } from '../achievements/entities/achievement.entity';
export { UserAchievement } from '../achievements/entities/user-achievement.entity';
export { GameSession } from '../game-engine/entities/game-session.entity';

// Export new entities for collections and categories
export { Category } from '../puzzles/entities/category.entity';
export { Collection } from '../puzzles/entities/collection.entity';

// Export new entities for streak tracking
export { UserStreak } from '../users/entities/user-streak.entity';
export { UserPuzzleCompletion } from '../users/entities/user-puzzle-completion.entity';