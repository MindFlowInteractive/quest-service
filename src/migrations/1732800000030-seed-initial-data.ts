import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1732800000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed puzzle categories
    await queryRunner.query(`
      INSERT INTO puzzle_categories (id, name, slug, description, color, sort_order, metadata) VALUES
      ('${this.generateUUID()}', 'Logic & Reasoning', 'logic-reasoning', 'Test your logical thinking and deduction skills', '#3B82F6', 1, '{"skills": ["logical thinking", "deduction", "pattern recognition"], "ageRange": {"min": 8, "max": 99}, "estimatedTimePerPuzzle": 5}'),
      ('${this.generateUUID()}', 'Mathematics', 'mathematics', 'Number puzzles and mathematical challenges', '#10B981', 2, '{"skills": ["arithmetic", "algebra", "geometry"], "ageRange": {"min": 10, "max": 99}, "estimatedTimePerPuzzle": 7}'),
      ('${this.generateUUID()}', 'Word Games', 'word-games', 'Vocabulary and language-based puzzles', '#F59E0B', 3, '{"skills": ["vocabulary", "spelling", "word association"], "ageRange": {"min": 6, "max": 99}, "estimatedTimePerPuzzle": 4}'),
      ('${this.generateUUID()}', 'Visual & Spatial', 'visual-spatial', 'Puzzles involving visual perception and spatial reasoning', '#EF4444', 4, '{"skills": ["spatial reasoning", "visual perception", "pattern matching"], "ageRange": {"min": 8, "max": 99}, "estimatedTimePerPuzzle": 6}'),
      ('${this.generateUUID()}', 'Memory', 'memory', 'Test and improve your memory skills', '#8B5CF6', 5, '{"skills": ["short-term memory", "working memory", "recall"], "ageRange": {"min": 5, "max": 99}, "estimatedTimePerPuzzle": 3}'),
      ('${this.generateUUID()}', 'Strategy', 'strategy', 'Strategic thinking and planning puzzles', '#06B6D4', 6, '{"skills": ["strategic thinking", "planning", "decision making"], "ageRange": {"min": 12, "max": 99}, "estimatedTimePerPuzzle": 10}');
    `);

    // Seed initial achievements
    await queryRunner.query(`
      INSERT INTO achievements (id, name, description, category, rarity, points, unlock_conditions, metadata) VALUES
      ('${this.generateUUID()}', 'First Steps', 'Complete your first puzzle', 'puzzle_mastery', 'common', 10, 
        '{"type": "single", "conditions": [{"id": "first_puzzle", "type": "puzzle_completion", "operator": "greater_than", "value": 0, "description": "Complete at least 1 puzzle"}]}',
        '{"difficulty": 1, "estimatedTime": 1, "celebrationMessage": "Welcome to the puzzle world!"}'),
      
      ('${this.generateUUID()}', 'Speed Demon', 'Complete a puzzle in under 30 seconds', 'speed', 'rare', 25,
        '{"type": "single", "conditions": [{"id": "speed_completion", "type": "time_limit", "operator": "less_than", "value": 30, "description": "Complete any puzzle in under 30 seconds"}]}',
        '{"difficulty": 5, "estimatedTime": 30, "celebrationMessage": "Lightning fast!"}'),
      
      ('${this.generateUUID()}', 'Perfectionist', 'Complete 10 puzzles with 100% accuracy', 'consistency', 'epic', 50,
        '{"type": "single", "conditions": [{"id": "perfect_streak", "type": "accuracy", "operator": "equals", "value": 100, "description": "Complete 10 puzzles with perfect accuracy", "metadata": {"count": 10}}]}',
        '{"difficulty": 7, "estimatedTime": 120, "celebrationMessage": "Absolute perfection!"}'),
      
      ('${this.generateUUID()}', 'Category Master', 'Complete 50 puzzles in any single category', 'exploration', 'epic', 75,
        '{"type": "single", "conditions": [{"id": "category_mastery", "type": "category_mastery", "operator": "greater_than", "value": 49, "description": "Complete 50 puzzles in one category"}]}',
        '{"difficulty": 8, "estimatedTime": 300, "celebrationMessage": "You have mastered this category!"}'),
      
      ('${this.generateUUID()}', 'Legendary Solver', 'Reach a total score of 10,000 points', 'milestone', 'legendary', 100,
        '{"type": "single", "conditions": [{"id": "score_milestone", "type": "score_threshold", "operator": "greater_than", "value": 9999, "description": "Accumulate 10,000 total points"}]}',
        '{"difficulty": 10, "estimatedTime": 600, "celebrationMessage": "You are a legendary puzzle solver!"}');
    `);

    // Seed sample puzzles
    await queryRunner.query(`
      INSERT INTO puzzles (id, title, description, category, difficulty, difficulty_rating, base_points, time_limit, content, hints, tags) VALUES
      ('${this.generateUUID()}', 'Number Sequence', 'Find the next number in the sequence: 2, 4, 8, 16, ?', 'logic-reasoning', 'easy', 2, 50, 120,
        '{"type": "fill-blank", "question": "What comes next in the sequence: 2, 4, 8, 16, ?", "correctAnswer": "32", "explanation": "Each number is double the previous number (powers of 2)"}',
        '[{"order": 1, "text": "Look for a pattern in how each number relates to the previous one", "pointsPenalty": 5}, {"order": 2, "text": "Try multiplying each number by 2", "pointsPenalty": 10}]',
        'sequence,pattern,multiplication'),
      
      ('${this.generateUUID()}', 'Color Logic', 'If red means stop and green means go, what does yellow mean?', 'logic-reasoning', 'easy', 1, 30, 60,
        '{"type": "multiple-choice", "question": "In traffic lights, if red means stop and green means go, what does yellow mean?", "options": ["Speed up", "Caution/Prepare to stop", "Turn left", "Emergency"], "correctAnswer": 1, "explanation": "Yellow means caution or prepare to stop"}',
        '[{"order": 1, "text": "Think about traffic light meanings", "pointsPenalty": 5}]',
        'logic,traffic,colors'),
      
      ('${this.generateUUID()}', 'Word Puzzle', 'Unscramble: WOLRD', 'word-games', 'easy', 2, 40, 90,
        '{"type": "fill-blank", "question": "Unscramble these letters to form a word: W-O-L-R-D", "correctAnswer": "WORLD", "explanation": "The letters spell WORLD"}',
        '[{"order": 1, "text": "Try different letter combinations", "pointsPenalty": 5}, {"order": 2, "text": "Think of common 5-letter words", "pointsPenalty": 10}]',
        'anagram,word,unscramble'),
      
      ('${this.generateUUID()}', 'Shape Count', 'How many triangles can you see in this pattern?', 'visual-spatial', 'medium', 4, 80, 180,
        '{"type": "fill-blank", "question": "Count all the triangles in the given pattern", "correctAnswer": "13", "explanation": "Including overlapping triangles, there are 13 triangles total", "media": {"images": ["triangle-pattern.svg"]}}',
        '[{"order": 1, "text": "Look for triangles of different sizes", "pointsPenalty": 10}, {"order": 2, "text": "Don t forget overlapping triangles", "pointsPenalty": 15}]',
        'shapes,counting,visual'),
      
      ('${this.generateUUID()}', 'Memory Challenge', 'Remember this sequence: 7, 3, 9, 1, 5', 'memory', 'medium', 3, 60, 240,
        '{"type": "fill-blank", "question": "What was the sequence of numbers shown?", "correctAnswer": "7,3,9,1,5", "explanation": "The sequence was: 7, 3, 9, 1, 5"}',
        '[{"order": 1, "text": "Try to create a story or pattern with the numbers", "pointsPenalty": 10}]',
        'memory,sequence,numbers');
    `);

    // Create admin user
    await queryRunner.query(`
      INSERT INTO users (id, username, first_name, last_name, email, password, role, status, preferences, profile, metadata) VALUES
      ('${this.generateUUID()}', 'admin', 'System', 'Administrator', 'admin@quest-service.com', '$2b$10$hash_placeholder', 'admin', 'active',
        '{"theme": "dark", "notifications": {"email": true, "push": true}}',
        '{"bio": "System administrator account"}',
        '{"emailVerified": true, "loginCount": 0}');
    `);

    // Update puzzle counts in categories
    await queryRunner.query(`
      UPDATE puzzle_categories SET puzzle_count = (
        SELECT COUNT(*) FROM puzzles WHERE category = puzzle_categories.slug AND is_active = true
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM puzzles;');
    await queryRunner.query('DELETE FROM achievements;');
    await queryRunner.query('DELETE FROM puzzle_categories;');
    await queryRunner.query('DELETE FROM users WHERE role = \'admin\';');
  }

  private generateUUID(): string {
    return 'uuid_generate_v4()';
  }
}
