import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm"
import { User } from "./user.entity"

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  token: string

  @Column()
  expiresAt: Date

  @Column({ default: false })
  isRevoked: boolean

  @ManyToOne(
    () => User,
    (user) => user.refreshTokens,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user: User

  @Column()
  userId: string // Foreign key for User

  @CreateDateColumn()
  createdAt: Date
}
