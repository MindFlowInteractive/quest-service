import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('history')
export class History {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    playerId!: string;

    @Column()
    puzzleId!: string;

    @Column()
    action!: string; // 'view', 'start', 'complete', 'fail', 'rate'

    @Column('float', { nullable: true })
    rating?: number; // 1-5 if action is 'rate'

    @Column('int', { nullable: true })
    timeSpent?: number; // in seconds

    @Column({ type: 'simple-json', nullable: true })
    metadata?: any;

    @CreateDateColumn()
    timestamp!: Date;
}
