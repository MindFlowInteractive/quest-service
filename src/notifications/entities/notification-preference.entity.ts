import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 128, unique: true })
  userId: string;

  @Column({ name: 'quest_assigned', default: true })
  questAssigned: boolean;

  @Column({ name: 'quest_completed', default: true })
  questCompleted: boolean;

  @Column({ name: 'quest_approved', default: true })
  questApproved: boolean;

  @Column({ name: 'quest_rejected', default: true })
  questRejected: boolean;

  @Column({ name: 'reward_received', default: true })
  rewardReceived: boolean;

  @Column({ name: 'achievement_unlocked', default: true })
  achievementUnlocked: boolean;

  @Column({ name: 'level_up', default: true })
  levelUp: boolean;

  @Column({ name: 'badge_earned', default: true })
  badgeEarned: boolean;

  @Column({ name: 'system', default: true })
  system: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
