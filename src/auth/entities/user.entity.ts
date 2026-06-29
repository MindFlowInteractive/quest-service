import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm"
import { Role } from "./role.entity"
import { RefreshToken } from "./refresh-token.entity"
import { TwoFactorBackupCode } from "./two-factor-backup-code.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  email: string

  @Column({ select: false }) // Do not select password by default
  password?: string // Optional for OAuth users

  @Column({ default: false })
  isVerified: boolean

  @Column({ nullable: true })
  verificationToken?: string

  @Column({ nullable: true })
  resetPasswordToken?: string

  @Column({ nullable: true })
  resetPasswordExpires?: Date

  @ManyToOne(
    () => Role,
    (role) => role.users,
    { eager: true },
  ) // Eager load role
  @JoinColumn({ name: "roleId" })
  role: Role

  @Column({ nullable: true })
  roleId: number // Foreign key for Role

  @OneToMany(
    () => RefreshToken,
    (refreshToken) => refreshToken.user,
  )
  refreshTokens: RefreshToken[]

  @OneToMany(
    () => TwoFactorBackupCode,
    (backupCode) => backupCode.user,
  )
  backupCodes: TwoFactorBackupCode[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Optional: For OAuth users
  @Column({ nullable: true })
  googleId?: string

  @Column({ nullable: true })
  githubId?: string

  @Column({ nullable: true })
  discordId?: string

  @Column({ nullable: true })
  twitterId?: string

  // Two-Factor Authentication fields
  @Column({ nullable: true, select: false })
  twoFactorSecret?: string

  @Column({ default: false })
  isTwoFactorEnabled: boolean
}
