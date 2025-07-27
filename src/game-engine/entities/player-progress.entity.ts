import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import type { PuzzleType, DifficultyLevel } from "../types/puzzle.types"

@Entity("player_progress")
@Index(["playerId"], { unique: true })
export class PlayerProgress {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  @Index()
  playerId: string

  @Column({ type: "int", default: 0 })
  totalPuzzlesSolved: number

  @Column({ type: "int", default: 0 })
  totalTimeSpent: number

  @Column({ type: "float", default: 0 })
  averageCompletionTime: number

  @Column({ type: "float", default: 0 })
  successRate: number

  @Column({ type: "int", default: 0 })
  currentStreak: number

  @Column({ type: "int", default: 0 })
  bestStreak: number

  @Column({ type: "int", default: 1 })
  preferredDifficulty: DifficultyLevel

  @Column({ type: "jsonb", default: {} })
  skillLevels: Record<PuzzleType, number>

  @Column({ type: "jsonb", default: [] })
  unlockedPuzzles: string[]

  @Column({ type: "jsonb", default: {} })
  achievements: Record<string, any>

  @Column({ type: "jsonb", default: {} })
  statistics: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
