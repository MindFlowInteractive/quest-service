import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum SocialProvider {
    DISCORD = 'discord',
    TWITTER = 'twitter',
    GOOGLE = 'google',
}

@Entity('social_accounts')
@Index(['userId', 'provider'], { unique: true })
export class SocialAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'enum', enum: SocialProvider })
    provider: SocialProvider;

    @Column()
    providerUserId: string;

    @Column({ nullable: true })
    providerUsername?: string;

    @Column({ nullable: true })
    accessToken?: string;

    @Column({ nullable: true })
    refreshToken?: string;

    @Column({ type: 'timestamp', nullable: true })
    tokenExpiresAt?: Date;

    @CreateDateColumn()
    linkedAt: Date;
}
