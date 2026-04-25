// difficulty-feedback.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DifficultyFeedback } from './difficulty-feedback.entity';

@Injectable()
export class DifficultyFeedbackService {
  constructor(private readonly repo: Repository<DifficultyFeedback>) {}

  async submitFeedback(puzzleId: string, playerId: string, rating: string) {
    const existing = await this.repo.findOne({ where: { puzzleId, playerId } });
    if (existing) throw new Error('Duplicate feedback not allowed');

    const feedback = this.repo.create({ puzzleId, playerId, rating });
    return this.repo.save(feedback);
  }

  async getSummary(puzzleId: string) {
    const feedbacks = await this.repo.find({ where: { puzzleId } });
    const counts = { too_easy: 0, just_right: 0, too_hard: 0 };
    feedbacks.forEach(f => counts[f.rating]++);

    const total = feedbacks.length;
    const sentimentScore = total > 0 ? (counts.just_right / total) : 0;

    return { counts, sentimentScore };
  }

  async getFlagged() {
    const puzzles = await this.repo.query(`
      SELECT puzzleId,
             SUM(CASE WHEN rating='too_easy' THEN 1 ELSE 0 END) as too_easy,
             SUM(CASE WHEN rating='too_hard' THEN 1 ELSE 0 END) as too_hard,
             COUNT(*) as total
      FROM difficulty_feedback
      GROUP BY puzzleId
      HAVING (too_easy::float / COUNT(*)) > 0.8 OR (too_hard::float / COUNT(*)) > 0.8
    `);
    return puzzles;
  }

  async notifyCreators() {
    const puzzles = await this.repo.query(`
      SELECT puzzleId, rating, COUNT(*) as count
      FROM difficulty_feedback
      GROUP BY puzzleId, rating
      HAVING COUNT(*) >= 10 AND (rating='too_easy' OR rating='too_hard')
    `);
    // send in-app notifications to puzzle creators
  }
}
