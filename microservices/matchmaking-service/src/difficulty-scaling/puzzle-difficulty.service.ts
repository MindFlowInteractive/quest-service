import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../puzzles/entities/puzzle-rating.entity';
import { calculatePuzzleDifficulty } from './puzzle-difficulty-algorithm';

@Injectable()
export class PuzzleDifficultyService {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleRating)
    private readonly puzzleRatingRepository: Repository<PuzzleRating>,
  ) {}

  /**
   * Returns a difficulty score from 1 (easy) to 5 (hard) for the puzzle.
   */
  async getPuzzleDifficulty(puzzleId: string): Promise<number> {
    const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
    const ratings = await this.puzzleRatingRepository.find({ where: { puzzleId } });
    return calculatePuzzleDifficulty(puzzle, ratings);
  }
}
