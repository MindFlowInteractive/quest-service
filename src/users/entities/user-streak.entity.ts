import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Assuming User entity is at this path

@Entity('user_streaks')
export class UserStreak {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.streak, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ default: 0 })
    currentStreak: number;

    @Column({ nullable: true })
    lastPuzzleCompletedAt: Date;

    @Column({ nullable: true })
    streakStartDate: Date; // When the current streak started

    @Column({ nullable: true })
    streakRecoveryGracePeriodEnd: Date; // For streak recovery mechanics
}
