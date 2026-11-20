import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Records that a player owns a locked board theme. */
@Entity('player_board_theme_unlocks')
@Index(['userId', 'themeId'], { unique: true })
export class PlayerBoardThemeUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'theme_id', type: 'uuid' })
  themeId: string;

  /** Where the theme came from, e.g. "purchase", "battle-pass", "admin" */
  @Column({ type: 'varchar', length: 64, default: 'grant' })
  source: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamp with time zone' })
  unlockedAt: Date;
}
