import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ReviewDecision {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    reportId: string;

    @Column('uuid')
    moderatorId: string;

    @Column({
        type: 'enum',
        enum: ReviewDecision,
    })
    decision: ReviewDecision;

    @Column('text', { nullable: true })
    comments: string;

    @CreateDateColumn()
    createdAt: Date;
}
