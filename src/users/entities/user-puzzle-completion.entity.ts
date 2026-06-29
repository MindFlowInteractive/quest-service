import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Entity('user_puzzle_completions')
export class UserPuzzleCompletion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.puzzleCompletions, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Puzzle, (puzzle) => puzzle.completions, { onDelete: 'CASCADE' })
    puzzle: Puzzle;

    @Column({ type: 'timestamp with time zone' })
    completedAt: Date;

    @Column({ nullable: true })
    comboMultiplier: number;

    /**
     * Version of the puzzle that the player solved.
     * References puzzle_versions.id — preserved even if the puzzle is later edited.
     */
    @Column({ type: 'uuid', name: 'puzzle_version_id', nullable: true })
    @Index()
    puzzleVersionId?: string;
}
