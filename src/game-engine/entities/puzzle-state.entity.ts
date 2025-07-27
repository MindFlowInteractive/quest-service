import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import type { PuzzleStatus, PuzzleType, DifficultyLevel } from "../types/puzzle.types"

@Entity("puzzle_states")
@Index(["playerId", "puzzleId"], { unique: true })
@Index(["playerId", "status"])
@Index(["puzzleType", "difficulty"])
export class PuzzleState {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  @Index()
  playerId: string

  @Column({ type: "varchar", length: 255 })
  @Index()
  puzzleId: string

  @Column({
    type: "enum",
    enum: ["logic_grid", "sequence", "pattern_matching", "spatial", "mathematical", "word_puzzle", "custom"],
  })
  puzzleType: PuzzleType

  @Column({ type: "enum", enum: ["not_started", "in_progress", "completed", "failed", "abandoned"] })
  status: PuzzleStatus

  @Column({ type: "int" })
  difficulty: DifficultyLevel

  @Column({ type: "jsonb" })
  currentState: any

  @Column({ type: "jsonb", default: [] })
  moves: any[]

  @Column({ type: "timestamp" })
  startTime: Date

  @Column({ type: "timestamp", nullable: true })
  endTime?: Date

  @Column({ type: "int", default: 0 })
  score: number

  @Column({ type: "int", default: 0 })
  hintsUsed: number

  @Column({ type: "int", default: 0 })
  timeSpent: number

  @Column({ type: "jsonb", default: {} })
  metadata: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
