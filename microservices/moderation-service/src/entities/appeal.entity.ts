import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AppealStatus {
    PENDING = 'PENDING',
    UNDER_REVIEW = 'UNDER_REVIEW',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

@Entity('appeals')
export class Appeal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @Column('uuid')
    violationId: string;

    @Column('text')
    reason: string;

    @Column({
        type: 'enum',
        enum: AppealStatus,
        default: AppealStatus.PENDING,
    })
    status: AppealStatus;

    @Column('uuid', { nullable: true })
    reviewerId: string;

    @Column('text', { nullable: true })
    reviewComments: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt: Date;
}
