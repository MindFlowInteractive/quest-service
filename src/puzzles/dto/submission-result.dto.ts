import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SolutionAttemptStatus } from '../entities/puzzle-solution-attempt.entity';

/**
 * Reward breakdown returned with a successful (correct) submission.
 */
export class RewardBreakdownDto {
    @ApiProperty({ example: 350 })
    baseScore: number;

    @ApiProperty({ example: 50 })
    timeBonus: number;

    @ApiProperty({ example: 30 })
    streakBonus: number;

    @ApiProperty({ example: -20 })
    hintPenalty: number;

    @ApiPropertyOptional({ example: 100 })
    firstSolveBonus?: number;

    @ApiProperty({ example: 410 })
    totalScore: number;

    @ApiProperty({ example: 205 })
    totalExperience: number;

    @ApiProperty({ example: ['speed_demon', 'independent_thinker'] })
    achievements: string[];
}

/**
 * Response returned from POST /puzzles/:id/submit
 */
export class SubmissionResultDto {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    submissionId: string;

    @ApiProperty({ enum: SolutionAttemptStatus, example: SolutionAttemptStatus.CORRECT })
    status: SolutionAttemptStatus;

    @ApiProperty({ example: true })
    isCorrect: boolean;

    @ApiProperty({
        description: 'Elapsed time in seconds between when the puzzle was started and when it was submitted.',
        example: 45,
    })
    timeTakenSeconds: number;

    @ApiPropertyOptional({
        type: RewardBreakdownDto,
        description: 'Only present when status is "correct".',
    })
    rewards?: RewardBreakdownDto;

    @ApiPropertyOptional({
        description: 'Human-readable explanation of why the submission was rejected.',
        example: 'Time limit exceeded',
    })
    message?: string;

    @ApiPropertyOptional({
        description: 'Explanation of the correct answer (shown after submission).',
        example: 'The answer is B because...',
    })
    explanation?: string;
}

/**
 * A single entry in a submission history list.
 */
export class SubmissionHistoryItemDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    puzzleId: string;

    @ApiProperty({ enum: SolutionAttemptStatus })
    status: SolutionAttemptStatus;

    @ApiProperty()
    timeTakenSeconds: number;

    @ApiProperty()
    scoreAwarded: number;

    @ApiProperty()
    hintsUsed: number;

    @ApiProperty()
    createdAt: Date;
}

/**
 * Paginated list of submission history entries.
 */
export class SubmissionHistoryDto {
    @ApiProperty({ type: [SubmissionHistoryItemDto] })
    items: SubmissionHistoryItemDto[];

    @ApiProperty({ example: 42 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 3 })
    totalPages: number;
}
