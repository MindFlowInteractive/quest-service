import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export enum WebhookEventStatus {
    RECEIVED = 'received',
    PROCESSED = 'processed',
    FAILED = 'failed',
}

@Entity('webhook_events')
export class WebhookEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    source: string;

    @Column()
    eventType: string;

    @Column({ type: 'jsonb', default: {} })
    payload: Record<string, any>;

    @Column({
        type: 'enum',
        enum: WebhookEventStatus,
        default: WebhookEventStatus.RECEIVED,
    })
    status: WebhookEventStatus;

    @CreateDateColumn()
    receivedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    processedAt?: Date;

    @Column({ nullable: true })
    errorMessage?: string;
}
