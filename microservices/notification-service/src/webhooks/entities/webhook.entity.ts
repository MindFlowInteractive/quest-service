import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'webhooks' })
export class Webhook {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    url: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    events: string[]; // Array of event types this webhook subscribes to

    @Column({ nullable: true })
    secret: string; // For HMAC signature verification

    @Column({ default: 0 })
    failureCount: number;

    @Column({ nullable: true })
    lastTriggeredAt: Date;

    @Column({ nullable: true })
    lastSuccessAt: Date;

    @Column({ nullable: true })
    lastFailureAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
