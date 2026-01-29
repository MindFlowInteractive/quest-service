import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import type { PuzzleMove, ValidationResult } from '../../game-engine/types/puzzle.types';

/**
 * Entity for detailed audit trail of puzzle moves
 * Used for forensic analysis and pattern detection
 */
@Entity('puzzle_move_audit')
@Index(['playerId', 'puzzleId', 'createdAt'])
@Index(['sessionId'])
@Index(['flaggedAsSuspicious', 'createdAt'])
export class PuzzleMoveAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'uuid' })
  @Index()
  sessionId: string;

  @Column({ type: 'jsonb' })
  moveData: PuzzleMove;

  @Column({ type: 'int' })
  moveNumber: number;

  @Column({ type: 'int' })
  timeSincePreviousMove: number;

  @Column({ type: 'boolean' })
  wasValid: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationResult: ValidationResult | null;

  @Column({ type: 'jsonb', nullable: true })
  behaviorMetrics: {
    mouseMovements?: number;
    keystrokes?: number;
    focusLost?: boolean;
    clientTimestamp?: Date;
    deviceFingerprint?: string;
  } | null;

  @Column({ type: 'boolean', default: false })
  @Index()
  flaggedAsSuspicious: boolean;

  @Column({ type: 'jsonb', nullable: true })
  suspicionReasons: string[] | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Relations will be added when User and Puzzle entities are imported
  // @ManyToOne('User')
  // @JoinColumn({ name: 'playerId' })
  // player: any;

  // @ManyToOne('Puzzle')
  // @JoinColumn({ name: 'puzzleId' })
  // puzzle: any;
}
