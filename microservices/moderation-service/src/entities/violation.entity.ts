import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ViolationSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum ActionTaken {
    WARN = 'WARN',
    SUSPEND = 'SUSPEND',
    BAN = 'BAN',
    NONE = 'NONE',
}

@Entity('violations')
export class Violation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @Column()
    type: string;

    @Column({
        type: 'enum',
        enum: ViolationSeverity,
    })
    severity: ViolationSeverity;

    @Column('text', { nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ActionTaken,
        default: ActionTaken.NONE,
    })
    actionTaken: ActionTaken;

    @CreateDateColumn()
    createdAt: Date;
}
