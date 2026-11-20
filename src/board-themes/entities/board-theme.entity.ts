import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Visual assets the frontend needs to render a board theme. */
export interface BoardThemeAssets {
  /** Background image or texture for the board */
  boardImageUrl?: string;
  /** Sprite sheet or folder for the puzzle pieces / tiles */
  pieceSetUrl?: string;
  /** Small image shown in the theme picker */
  previewUrl?: string;
  /** Named colour tokens, e.g. { background: '#111', grid: '#333' } */
  colors?: Record<string, string>;
}

@Entity('board_themes')
export class BoardTheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable identifier used by clients, e.g. "classic-wood" */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  slug: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Free themes can be selected by every player without owning them */
  @Column({ name: 'is_free', type: 'boolean', default: false })
  isFree: boolean;

  /** Inactive themes are hidden from the catalog and cannot be selected */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Optional hint shown for locked themes, e.g. "Complete chapter 3" */
  @Column({
    name: 'unlock_hint',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  unlockHint: string | null;

  @Column({ type: 'jsonb', default: {} })
  assets: BoardThemeAssets;

  /**
   * Incremented every time `assets` changes so clients can bust cached
   * images and know when to re-download the theme.
   */
  @Column({ name: 'asset_version', type: 'int', default: 1 })
  assetVersion: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
