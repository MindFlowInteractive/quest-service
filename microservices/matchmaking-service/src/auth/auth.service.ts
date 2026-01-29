import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import type { User } from "./entities/user.entity"
import type { Role } from "./entities/role.entity"
import type { RefreshToken } from "./entities/refresh-token.entity"
import type { RegisterUserDto } from "./dto/register-user.dto"
import type { LoginUserDto } from "./dto/login-user.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"
import type { VerifyEmailDto } from "./dto/verify-email.dto"
import type { JwtPayload } from "./interfaces/jwt-payload.interface"
import { BCRYPT_SALT_ROUNDS, jwtConstants, UserRole } from "./constants"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: Repository<User>,
    private rolesRepository: Repository<Role>,
    private refreshTokensRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) { }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.role ? [user.role.name] : [],
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessExpiresIn,
    })

    const refreshToken = uuidv4() // Generate a unique refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number.parseInt(jwtConstants.refreshExpiresIn.replace("d", ""))) // Add days

    const newRefreshToken = this.refreshTokensRepository.create({
      token: refreshToken,
      expiresAt: expiresAt,
      userId: user.id,
    })
    await this.refreshTokensRepository.save(newRefreshToken)

    return { accessToken, refreshToken }
  }

  async register(registerUserDto: RegisterUserDto) {
    const { email, password, roleName } = registerUserDto

    const existingUser = await this.usersRepository.findOne({ where: { email } })
    if (existingUser) {
      throw new ConflictException("User with this email already exists.")
    }

    const hashedPassword = await this.hashPassword(password)
    const verificationToken = uuidv4()

    let role = await this.rolesRepository.findOne({ where: { name: roleName || UserRole.USER } })
    if (!role) {
      // Create default 'user' role if it doesn't exist
      role = this.rolesRepository.create({ name: UserRole.USER, description: "Standard user role" })
      await this.rolesRepository.save(role)
    }

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      role,
    })

    await this.usersRepository.save(user)

    // TODO: Send verification email (mocked for now)
    console.log(`Verification email sent to ${user.email} with token: ${verificationToken}`)

    return { message: "User registered successfully. Please verify your email.", userId: user.id }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto

    const user = await this.usersRepository.findOne({
      where: { email },
      select: ["id", "email", "password", "isVerified", "role"], // Explicitly select password
      relations: ["role"],
    })

    if (!user || !user.password || !(await this.comparePasswords(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials.")
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your email before logging in.")
    }

    return this.generateTokens(user)
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto
    const user = await this.usersRepository.findOne({ where: { verificationToken: token } })

    if (!user) {
      throw new BadRequestException("Invalid or expired verification token.")
    }

    user.isVerified = true
    user.verificationToken = undefined // Clear the token after verification
    await this.usersRepository.save(user)

    return { message: "Email verified successfully." }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto
    const user = await this.usersRepository.findOne({ where: { email } })

    if (!user) {
      // For security, do not reveal if the email exists or not
      return { message: "If a user with that email exists, a password reset link has been sent." }
    }

    const resetPasswordToken = uuidv4()
    const resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hour from now

    user.resetPasswordToken = resetPasswordToken
    user.resetPasswordExpires = resetPasswordExpires
    await this.usersRepository.save(user)

    // TODO: Send password reset email (mocked for now)
    console.log(`Password reset email sent to ${user.email} with token: ${resetPasswordToken}`)

    return { message: "If a user with that email exists, a password reset link has been sent." }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto

    const user = await this.usersRepository.findOne({ where: { resetPasswordToken: token } })

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException("Invalid or expired password reset token.")
    }

    user.password = await this.hashPassword(newPassword)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await this.usersRepository.save(user)

    return { message: "Password has been reset successfully." }
  }

  async refreshToken(userId: string, oldRefreshToken: string) {
    const existingToken = await this.refreshTokensRepository.findOne({
      where: { userId, token: oldRefreshToken, isRevoked: false },
      relations: ["user"],
    })

    if (!existingToken || existingToken.expiresAt < new Date()) {
      // If token is invalid or expired, revoke all tokens for this user for security
      if (existingToken) {
        await this.revokeAllRefreshTokensForUser(userId)
      }
      throw new UnauthorizedException("Invalid or expired refresh token. Please log in again.")
    }

    // Revoke the old token
    existingToken.isRevoked = true
    await this.refreshTokensRepository.save(existingToken)

    // Generate new tokens
    return this.generateTokens(existingToken.user)
  }

  async logout(userId: string, refreshToken: string) {
    const token = await this.refreshTokensRepository.findOne({
      where: { userId, token: refreshToken, isRevoked: false },
    })

    if (token) {
      token.isRevoked = true
      await this.refreshTokensRepository.save(token)
      return { message: "Logged out successfully." }
    }
    throw new BadRequestException("Refresh token not found or already revoked.")
  }

  async revokeAllRefreshTokensForUser(userId: string) {
    await this.refreshTokensRepository.update({ userId, isRevoked: false }, { isRevoked: true })
  }

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ["role"] })
    if (!user || !user.isVerified) {
      return null
    }
    return user
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokensRepository.findOne({
      where: { userId, token, isRevoked: false },
    })
    return !!(refreshToken && refreshToken.expiresAt > new Date())
  }

  async findOrCreateOAuthUser(
    oauthUser: any,
    provider: string,
  ): Promise<User> {
    // TODO: Implement OAuth user creation/linking
    throw new Error("OAuth functionality not yet implemented")
  }
}
