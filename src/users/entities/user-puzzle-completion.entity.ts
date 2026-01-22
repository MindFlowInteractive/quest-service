import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Assuming User entity is at this path
import { Puzzle } from '../../puzzles/entities/puzzle.entity'; // Assuming Puzzle entity is at this path

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
    comboMultiplier: number; // To store the combo multiplier at the time of completion
}
