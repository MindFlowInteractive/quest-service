import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { NotificationChannel } from '../../notifications/entities/notification.entity';

@Entity({ name: 'user_notification_preferences' })
@Unique(['userId', 'channel', 'notificationType'])
export class UserPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationChannel,
    })
    channel: NotificationChannel;

    @Column()
    notificationType: string; // e.g., 'ALL', 'QUEST_COMPLETED', etc.

    @Column({ default: true })
    isEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
