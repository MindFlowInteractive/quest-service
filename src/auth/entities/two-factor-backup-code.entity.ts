import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./user.entity"

@Entity("two_factor_backup_codes")
export class TwoFactorBackupCode {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  codeHash: string

  @Column({ default: false })
  isUsed: boolean

  @CreateDateColumn()
  usedAt?: Date

  @ManyToOne(
    () => User,
    (user) => user.backupCodes,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user: User

  @Column()
  userId: string

  @CreateDateColumn()
  createdAt: Date
}
