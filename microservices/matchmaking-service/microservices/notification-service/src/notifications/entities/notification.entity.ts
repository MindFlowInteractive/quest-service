import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
    READ = 'read',
}

export enum NotificationChannel {
    WEBSOCKET = 'websocket',
    PUSH = 'push',
    EMAIL = 'email',
    WEBHOOK = 'webhook',
}

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    type: string;

    @Column({ type: 'jsonb' })
    content: any;

    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    })
    status: NotificationStatus;

    @Column({
        type: 'enum',
        enum: NotificationChannel,
        array: true,
        default: [NotificationChannel.WEBSOCKET],
    })
    channels: NotificationChannel[];

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    readAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
