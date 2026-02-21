import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('integration_settings')
export class IntegrationSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    userId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ default: false })
    discordEnabled: boolean;

    @Column({ default: false })
    twitterEnabled: boolean;

    @Column({ nullable: true })
    discordWebhookUrl?: string;

    @Column({ nullable: true })
    discordChannelId?: string;

    @Column({ default: true })
    shareAchievements: boolean;

    @Column({ default: false })
    shareLeaderboard: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}
