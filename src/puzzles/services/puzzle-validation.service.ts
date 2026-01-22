import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPuzzleSubmission, PuzzleSubmissionStatus, ModerationAction } from '../entities/user-puzzle-submission.entity';
import { CreatePuzzleSubmissionDto, SubmitForReviewDto, ModerationDecisionDto } from '../dto/user-puzzle-submission.dto';

@Injectable()
export class PuzzleValidationService {
  private readonly logger = new Logger(PuzzleValidationService.name);

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
  ) {}

  async validatePuzzle(submission: UserPuzzleSubmission): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
    automatedChecks: {
      hasValidAnswer: boolean;
      hasExplanation: boolean;
      appropriateDifficulty: boolean;
      contentQuality: number;
      mediaValidation: boolean;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Basic content validation
    const automatedChecks = {
      hasValidAnswer: this.validateAnswer(submission.content),
      hasExplanation: this.validateExplanation(submission.content),
      appropriateDifficulty: this.validateDifficulty(submission),
      contentQuality: this.assessContentQuality(submission),
      mediaValidation: this.validateMedia(submission.content),
    };

    // Calculate validation score
    score = this.calculateValidationScore(automatedChecks);

    // Check for common issues
    if (!automatedChecks.hasValidAnswer) {
      errors.push('Puzzle must have a valid correct answer');
    }

    if (!submission.title || submission.title.length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (!submission.description || submission.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (submission.hints.length > submission.maxHints) {
      errors.push('Number of hints exceeds maximum allowed');
    }

    // Warnings for quality improvements
    if (!automatedChecks.hasExplanation) {
      warnings.push('Adding an explanation will improve puzzle quality');
    }

    if (submission.tags.length < 2) {
      warnings.push('Add more tags to improve discoverability');
    }

    if (submission.timeLimit < 60) {
      warnings.push('Time limit seems very short for this difficulty level');
    }

    const isValid = errors.length === 0 && score >= 70;

    return {
      isValid,
      errors,
      warnings,
      score,
      automatedChecks,
    };
  }

  private validateAnswer(content: any): boolean {
    if (!content.correctAnswer) return false;

    switch (content.type) {
      case 'multiple-choice':
        return Array.isArray(content.options) && 
               content.options.length >= 2 && 
               content.options.includes(content.correctAnswer);
      
      case 'fill-blank':
        return typeof content.correctAnswer === 'string' && 
               content.correctAnswer.trim().length > 0;
      
      case 'drag-drop':
        return typeof content.correctAnswer === 'object' && 
               content.correctAnswer !== null;
      
      default:
        return content.correctAnswer !== null && 
               content.correctAnswer !== undefined;
    }
  }

  private validateExplanation(content: any): boolean {
    return content.explanation && 
           typeof content.explanation === 'string' && 
           content.explanation.trim().length >= 10;
  }

  private validateDifficulty(submission: UserPuzzleSubmission): boolean {
    const { difficulty, difficultyRating, timeLimit, basePoints } = submission;
    
    // Basic difficulty consistency checks
    const difficultyRanges = {
      easy: { rating: [1, 3], time: [60, 300], points: [10, 100] },
      medium: { rating: [3, 6], time: [180, 600], points: [50, 200] },
      hard: { rating: [6, 8], time: [300, 1200], points: [100, 400] },
      expert: { rating: [8, 10], time: [600, 3600], points: [200, 1000] },
    };

    const range = difficultyRanges[difficulty];
    return range && 
           difficultyRating >= range.rating[0] && 
           difficultyRating <= range.rating[1] &&
           timeLimit >= range.time[0] && 
           timeLimit <= range.time[1] &&
           basePoints >= range.points[0] && 
           basePoints <= range.points[1];
  }

  private assessContentQuality(submission: UserPuzzleSubmission): number {
    let qualityScore = 0;
    const maxScore = 100;

    // Title quality (20 points)
    if (submission.title && submission.title.length >= 10) qualityScore += 10;
    if (submission.title && submission.title.length >= 20) qualityScore += 10;

    // Description quality (20 points)
    if (submission.description && submission.description.length >= 50) qualityScore += 10;
    if (submission.description && submission.description.length >= 100) qualityScore += 10;

    // Content structure (20 points)
    if (submission.content.question) qualityScore += 10;
    if (submission.content.explanation) qualityScore += 10;

    // Hints quality (15 points)
    if (submission.hints.length > 0) qualityScore += 5;
    if (submission.hints.length >= 2) qualityScore += 5;
    if (submission.hints.every(hint => hint.text.length >= 20)) qualityScore += 5;

    // Tags and categorization (15 points)
    if (submission.tags.length >= 3) qualityScore += 10;
    if (submission.tags.length >= 5) qualityScore += 5;

    // Creator notes (10 points)
    if (submission.creatorNotes && Object.keys(submission.creatorNotes).length > 0) {
      qualityScore += 10;
    }

    return Math.min(qualityScore, maxScore);
  }

  private validateMedia(content: any): boolean {
    if (!content.media) return true; // Media is optional

    const { images, videos, audio } = content.media;

    // Basic validation for media URLs
    if (images && Array.isArray(images)) {
      return images.every(url => typeof url === 'string' && url.length > 0);
    }

    if (videos && Array.isArray(videos)) {
      return videos.every(url => typeof url === 'string' && url.length > 0);
    }

    if (audio && Array.isArray(audio)) {
      return audio.every(url => typeof url === 'string' && url.length > 0);
    }

    return true;
  }

  private calculateValidationScore(checks: any): number {
    let score = 0;
    const weights = {
      hasValidAnswer: 30,
      hasExplanation: 20,
      appropriateDifficulty: 25,
      contentQuality: 20,
      mediaValidation: 5,
    };

    if (checks.hasValidAnswer) score += weights.hasValidAnswer;
    if (checks.hasExplanation) score += weights.hasExplanation;
    if (checks.appropriateDifficulty) score += weights.appropriateDifficulty;
    score += (checks.contentQuality / 100) * weights.contentQuality;
    if (checks.mediaValidation) score += weights.mediaValidation;

    return Math.round(score);
  }

  async checkForDuplicates(submission: UserPuzzleSubmission): Promise<{
    isDuplicate: boolean;
    similarPuzzles: Array<{
      id: string;
      title: string;
      similarity: number;
    }>;
  }> {
    // Simple duplicate detection based on title and content similarity
    const similarPuzzles = await this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.title ILIKE :title', { title: `%${submission.title}%` })
      .orWhere('submission.description ILIKE :description', { description: `%${submission.description}%` })
      .andWhere('submission.status != :rejected', { rejected: PuzzleSubmissionStatus.REJECTED })
      .andWhere('submission.id != :id', { id: submission.id })
      .select(['submission.id', 'submission.title'])
      .limit(5)
      .getMany();

    const similarityThreshold = 0.8;
    const duplicates = similarPuzzles.map(puzzle => ({
      id: puzzle.id,
      title: puzzle.title,
      similarity: this.calculateSimilarity(submission.title, puzzle.title),
    })).filter(result => result.similarity >= similarityThreshold);

    return {
      isDuplicate: duplicates.length > 0,
      similarPuzzles: duplicates,
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
