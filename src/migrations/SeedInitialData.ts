import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert puzzle categories
    await queryRunner.query(`
      INSERT INTO "puzzle_categories" ("id", "name", "slug", "description", "color", "sortOrder", "metadata") VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Logic Puzzles', 'logic', 'Mind-bending logical reasoning challenges', '#FF6B6B', 1, '{"skills": ["critical thinking", "deduction", "pattern recognition"], "ageRange": {"min": 8, "max": 99}, "estimatedTimePerPuzzle": 15}'),
      ('550e8400-e29b-41d4-a716-446655440002', 'Math Puzzles', 'math', 'Mathematical problem-solving adventures', '#4ECDC4', 2, '{"skills": ["arithmetic", "algebra", "geometry"], "ageRange": {"min": 10, "max": 99}, "estimatedTimePerPuzzle": 12}'),
      ('550e8400-e29b-41d4-a716-446655440003', 'Word Games', 'word', 'Vocabulary and language challenges', '#45B7D1', 3, '{"skills": ["vocabulary", "spelling", "comprehension"], "ageRange": {"min": 6, "max": 99}, "estimatedTimePerPuzzle": 8}'),
      ('550e8400-e29b-41d4-a716-446655440004', 'Pattern Recognition', 'pattern', 'Visual and sequential pattern challenges', '#F7DC6F', 4, '{"skills": ["pattern recognition", "visual processing", "sequence analysis"], "ageRange": {"min": 7, "max": 99}, "estimatedTimePerPuzzle": 10}'),
      ('550e8400-e29b-41d4-a716-446655440005', 'Spatial Reasoning', 'spatial', '3D thinking and spatial awareness puzzles', '#BB8FCE', 5, '{"skills": ["spatial awareness", "3D thinking", "visualization"], "ageRange": {"min": 9, "max": 99}, "estimatedTimePerPuzzle": 18}')
    `);

    // Insert sample puzzles
    await queryRunner.query(`
      INSERT INTO "puzzles" ("id", "title", "description", "category", "difficulty", "difficultyRating", "basePoints", "timeLimit", "maxHints", "isActive", "isFeatured", "publishedAt", "content", "hints", "tags", "scoring") VALUES
      ('660e8400-e29b-41d4-a716-446655440001', 'The Missing Number', 'Find the missing number in this logical sequence: 2, 4, 8, 16, ?', 'logic', 'easy', 2, 100, 300, 2, true, true, NOW(), 
       '{"type": "multiple-choice", "question": "What number comes next in the sequence: 2, 4, 8, 16, ?", "options": ["24", "32", "20", "18"], "correctAnswer": "32", "explanation": "Each number is double the previous number. 16 × 2 = 32"}',
       '[{"order": 1, "text": "Look for a pattern between consecutive numbers", "pointsPenalty": 10}, {"order": 2, "text": "Try multiplying each number by something", "pointsPenalty": 20}]',
       'sequence,numbers,pattern,multiplication',
       '{"timeBonus": {"enabled": true, "maxBonus": 50, "baseTime": 120}}'),
      
      ('660e8400-e29b-41d4-a716-446655440002', 'Simple Addition Challenge', 'Solve this basic arithmetic problem', 'math', 'easy', 1, 50, 180, 1, true, false, NOW(),
       '{"type": "fill-blank", "question": "What is 15 + 27?", "correctAnswer": "42", "explanation": "15 + 27 = 42"}',
       '[{"order": 1, "text": "Break it down: 15 + 20 + 7", "pointsPenalty": 15}]',
       'addition,arithmetic,basic',
       '{"accuracyBonus": {"enabled": true, "maxBonus": 25}}'),
      
      ('660e8400-e29b-41d4-a716-446655440003', 'Word Scramble', 'Unscramble these letters to form a common English word', 'word', 'medium', 3, 150, 240, 3, true, false, NOW(),
       '{"type": "fill-blank", "question": "Unscramble: TUESOMRC", "correctAnswer": "COMPUTER", "explanation": "The letters T-U-E-S-O-M-R-C can be rearranged to spell COMPUTER"}',
       '[{"order": 1, "text": "Think of technology-related words", "pointsPenalty": 20}, {"order": 2, "text": "It starts with C", "pointsPenalty": 30}, {"order": 3, "text": "It has 8 letters", "pointsPenalty": 40}]',
       'anagram,vocabulary,technology',
       '{"timeBonus": {"enabled": true, "maxBonus": 75, "baseTime": 180}}'),
      
      ('660e8400-e29b-41d4-a716-446655440004', 'Color Pattern', 'Complete the color pattern sequence', 'pattern', 'medium', 4, 200, 360, 2, true, true, NOW(),
       '{"type": "multiple-choice", "question": "What color comes next in the pattern: Red, Blue, Red, Blue, Red, ?", "options": ["Red", "Blue", "Green", "Yellow"], "correctAnswer": "Blue", "explanation": "The pattern alternates between Red and Blue"}',
       '[{"order": 1, "text": "Look at every other color", "pointsPenalty": 25}, {"order": 2, "text": "The pattern repeats every 2 colors", "pointsPenalty": 50}]',
       'colors,sequence,visual,alternating',
       '{"streakBonus": {"enabled": true, "multiplier": 1.5}}'),
      
      ('660e8400-e29b-41d4-a716-446655440005', 'Cube Rotation', 'Visualize how this cube would look when rotated', 'spatial', 'hard', 7, 300, 450, 3, true, false, NOW(),
       '{"type": "multiple-choice", "question": "If you rotate this cube 90 degrees clockwise, which face will be on top?", "options": ["Face A", "Face B", "Face C", "Face D"], "correctAnswer": "Face C", "explanation": "When rotated 90 degrees clockwise, Face C moves to the top position"}',
       '[{"order": 1, "text": "Imagine the cube in your mind", "pointsPenalty": 30}, {"order": 2, "text": "Think about which face is currently on the right", "pointsPenalty": 60}, {"order": 3, "text": "The right face becomes the top when rotated clockwise", "pointsPenalty": 90}]',
       '3d,rotation,visualization,cube',
       '{"timeBonus": {"enabled": true, "maxBonus": 150, "baseTime": 300}}')
    `);

    // Insert initial achievements
    await queryRunner.query(`
      INSERT INTO "achievements" ("id", "name", "description", "category", "rarity", "points", "isActive", "isSecret", "unlockConditions", "metadata") VALUES
      ('770e8400-e29b-41d4-a716-446655440001', 'First Step', 'Complete your very first puzzle', 'puzzle_mastery', 'common', 10, true, false,
       '{"type": "single", "conditions": [{"id": "first_puzzle", "type": "puzzle_completion", "operator": "greater_than", "value": 0, "description": "Complete any puzzle"}]}',
       '{"difficulty": 1, "estimatedTime": 5, "celebrationMessage": "Congratulations on solving your first puzzle!", "tips": ["Take your time", "Use hints if needed"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440002', 'Speed Demon', 'Complete a puzzle in under 30 seconds', 'speed', 'rare', 50, true, false,
       '{"type": "single", "conditions": [{"id": "fast_completion", "type": "time_limit", "operator": "less_than", "value": 30, "description": "Complete any puzzle in under 30 seconds"}]}',
       '{"difficulty": 6, "estimatedTime": 10, "celebrationMessage": "Lightning fast! You are a speed demon!", "tips": ["Start with easier puzzles", "Practice pattern recognition"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440003', 'Perfect Score', 'Complete a puzzle with 100% accuracy on first try', 'accuracy', 'rare', 40, true, false,
       '{"type": "multiple", "logic": "AND", "conditions": [{"id": "perfect_accuracy", "type": "accuracy", "operator": "equals", "value": 100, "description": "Get 100% accuracy"}, {"id": "first_attempt", "type": "custom", "operator": "equals", "value": 1, "description": "On first attempt"}]}',
       '{"difficulty": 5, "estimatedTime": 15, "celebrationMessage": "Flawless execution! Perfect score achieved!", "tips": ["Read carefully", "Think before answering"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440004', 'Puzzle Master', 'Complete 100 puzzles', 'puzzle_mastery', 'epic', 200, true, false,
       '{"type": "single", "conditions": [{"id": "hundred_puzzles", "type": "puzzle_completion", "operator": "greater_than", "value": 99, "description": "Complete 100+ puzzles"}]}',
       '{"difficulty": 8, "estimatedTime": 300, "celebrationMessage": "You are a true Puzzle Master! 100 puzzles conquered!", "tips": ["Try different categories", "Challenge yourself with harder puzzles"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440005', 'Streak Champion', 'Get a solving streak of 20 correct answers in a row', 'consistency', 'epic', 150, true, false,
       '{"type": "single", "conditions": [{"id": "twenty_streak", "type": "streak", "operator": "greater_than", "value": 19, "description": "Achieve 20+ correct answers in a row"}]}',
       '{"difficulty": 7, "estimatedTime": 120, "celebrationMessage": "Incredible consistency! 20 in a row!", "tips": ["Start with easier puzzles", "Stay focused", "Take breaks if needed"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440006', 'Category Explorer', 'Complete at least one puzzle from each category', 'exploration', 'rare', 75, true, false,
       '{"type": "multiple", "logic": "AND", "conditions": [{"id": "logic_category", "type": "category_mastery", "operator": "greater_than", "value": 0, "description": "Complete a logic puzzle"}, {"id": "math_category", "type": "category_mastery", "operator": "greater_than", "value": 0, "description": "Complete a math puzzle"}, {"id": "word_category", "type": "category_mastery", "operator": "greater_than", "value": 0, "description": "Complete a word puzzle"}, {"id": "pattern_category", "type": "category_mastery", "operator": "greater_than", "value": 0, "description": "Complete a pattern puzzle"}, {"id": "spatial_category", "type": "category_mastery", "operator": "greater_than", "value": 0, "description": "Complete a spatial puzzle"}]}',
       '{"difficulty": 4, "estimatedTime": 60, "celebrationMessage": "Well-rounded solver! You have explored all categories!", "tips": ["Try different puzzle types", "Each category develops different skills"]}'),
      
      ('770e8400-e29b-41d4-a716-446655440007', 'Night Owl', 'Complete 10 puzzles between 10 PM and 6 AM', 'social', 'rare', 60, true, true,
       '{"type": "time_based", "conditions": [{"id": "night_puzzles", "type": "puzzle_completion", "operator": "greater_than", "value": 9, "description": "Complete 10+ puzzles during night hours"}], "timeWindow": {"duration": 8, "type": "recurring"}}',
       '{"difficulty": 3, "estimatedTime": 180, "celebrationMessage": "Night owl achievement unlocked! Burning the midnight oil!", "tips": ["This is a secret achievement", "Play during late hours"]})
    `);

    // Update puzzle counts for categories
    await queryRunner.query(`
      UPDATE "puzzle_categories" SET "puzzleCount" = (
        SELECT COUNT(*) FROM "puzzles" 
        WHERE "puzzles"."category" = "puzzle_categories"."slug" 
        AND "isActive" = true
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "achievements";');
    await queryRunner.query('DELETE FROM "puzzles";');
    await queryRunner.query('DELETE FROM "puzzle_categories";');
  }
}
