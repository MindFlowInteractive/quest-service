import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"
import type { PuzzleType, DifficultyLevel } from "../types/puzzle.types"

@Entity("puzzle_analytics")
@Index(["puzzleId", "playerId"])
@Index(["puzzleType", "difficulty"])
@Index(["timestamp"])
export class PuzzleAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 255 })
  @Index()
  puzzleId: string

  @Column({ type: "uuid" })
  @Index()
  playerId: string

  @Column({ type: "varchar", length: 255 })
  sessionId: string

  @Column({
    type: "enum",
    enum: ["logic_grid", "sequence", "pattern_matching", "spatial", "mathematical", "word_puzzle", "custom"],
  })
  puzzleType: PuzzleType

  @Column({ type: "int" })
  difficulty: DifficultyLevel

  @Column({ type: "varchar", length: 50 })
  eventType: string

  @Column({ type: "jsonb" })
  eventData: any

  @Column({ type: "int", default: 0 })
  timeSpent: number

  @Column({ type: "int", default: 0 })
  moveCount: number

  @Column({ type: "int", default: 0 })
  hintsUsed: number

  @Column({ type: "int", default: 0 })
  score: number

  @Column({ type: "boolean", default: false })
  completed: boolean

  @Column({ type: "jsonb", default: {} })
  metadata: Record<string, any>

  @Column({ type: "timestamp" })
  @Index()
  timestamp: Date

  @CreateDateColumn()
  createdAt: Date
}
