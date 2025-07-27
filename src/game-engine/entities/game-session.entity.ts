import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("game_sessions")
@Index(["playerId", "startTime"])
@Index(["sessionId"], { unique: true })
export class GameSession {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 255 })
  @Index()
  sessionId: string

  @Column({ type: "uuid" })
  @Index()
  playerId: string

  @Column({ type: "timestamp" })
  startTime: Date

  @Column({ type: "timestamp", nullable: true })
  endTime?: Date

  @Column({ type: "int", default: 0 })
  puzzlesAttempted: number

  @Column({ type: "int", default: 0 })
  puzzlesCompleted: number

  @Column({ type: "int", default: 0 })
  totalScore: number

  @Column({ type: "int", default: 0 })
  totalHintsUsed: number

  @Column({ type: "jsonb", default: [] })
  puzzleIds: string[]

  @Column({ type: "jsonb", default: {} })
  sessionData: Record<string, any>

  @Column({ type: "boolean", default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
