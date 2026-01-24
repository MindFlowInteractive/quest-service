import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ReportStatus {
    PENDING = 'PENDING',
    REVIEWING = 'REVIEWING',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED',
}

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    reporterId: string;

    @Column('uuid')
    reportedEntityId: string;

    @Column()
    reportedEntityType: string;

    @Column()
    reason: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
