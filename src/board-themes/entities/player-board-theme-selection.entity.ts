import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** The board theme a player has chosen. One row per player. */
@Entity('player_board_theme_selections')
export class PlayerBoardThemeSelection {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'theme_id', type: 'uuid' })
  themeId: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
