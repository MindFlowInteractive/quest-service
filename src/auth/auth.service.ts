import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import type { DeepPartial } from "typeorm"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import { generateSecret, verify } from "otplib"
import * as QRCode from "qrcode"
import { User } from "./entities/user.entity"
import { Role } from "./entities/role.entity"
import { RefreshToken } from "./entities/refresh-token.entity"
import { TwoFactorBackupCode } from "./entities/two-factor-backup-code.entity"
import type { RegisterUserDto } from "./dto/register-user.dto"
import type { LoginUserDto } from "./dto/login-user.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"
import type { VerifyEmailDto } from "./dto/verify-email.dto"
import type { JwtPayload } from "./interfaces/jwt-payload.interface"
import { BCRYPT_SALT_ROUNDS, jwtConstants, UserRole } from "./constants"
import { v4 as uuidv4 } from "uuid"
import { WEBHOOK_INTERNAL_EVENTS } from "../webhooks/webhook.constants"

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    @InjectRepository(TwoFactorBackupCode)
    private backupCodesRepository: Repository<TwoFactorBackupCode>,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
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
      expiresIn: jwtConstants.accessExpiresIn as `${number}m`,
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

    this.eventEmitter.emit(WEBHOOK_INTERNAL_EVENTS.userRegistered, {
      userId: user.id,
      email: user.email,
      role: role.name,
      registeredAt: new Date().toISOString(),
    })

    // TODO: Send verification email (mocked for now)
    console.log(`Verification email sent to ${user.email} with token: ${verificationToken}`)

    return { message: "User registered successfully. Please verify your email.", userId: user.id }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto

    const user = await this.usersRepository.findOne({
      where: { email },
      select: ["id", "email", "password", "isVerified", "isTwoFactorEnabled", "role"], // Explicitly select password and 2FA status
      relations: ["role"],
    })

    if (!user || !user.password || !(await this.comparePasswords(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials.")
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your email before logging in.")
    }

    // If 2FA is enabled, issue mfa_pending token instead of full tokens
    if (user.isTwoFactorEnabled) {
      return this.generateMfaPendingToken(user)
    }

    return this.generateTokens(user)
  }

  async generateMfaPendingToken(user: User) {
    const payload: JwtPayload & { isMfaPending: boolean } = {
      sub: user.id,
      email: user.email,
      roles: user.role ? [user.role.name] : [],
      isMfaPending: true,
    }

    const mfaPendingToken = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.mfaPendingExpiresIn as `${number}m`,
    })

    return {
      mfaPendingToken,
      message: "2FA verification required",
    }
  }

  async challengeTwoFactor(mfaPendingToken: string, code: string) {
    try {
      const payload = await this.jwtService.verifyAsync(mfaPendingToken, {
        secret: jwtConstants.secret,
      })

      if (!payload.isMfaPending || !payload.sub) {
        throw new UnauthorizedException("Invalid MFA pending token")
      }

      // Verify the 2FA code
      const isValid = await this.verifyTwoFactorCode(payload.sub, code)
      if (!isValid) {
        throw new UnauthorizedException("Invalid 2FA code")
      }

      // Get user with role
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ["role"],
      })

      if (!user) {
        throw new UnauthorizedException("User not found")
      }

      // Issue full tokens
      return this.generateTokens(user)
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new UnauthorizedException("MFA pending token expired. Please login again.")
      }
      throw error
    }
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
    provider: string,
    oauthUser: any,
  ): Promise<User> {
    const providerIdField = `${provider}Id` as keyof User;
    const providerId = oauthUser[providerIdField] || oauthUser.providerUserId;

    // 1. Try to find user by provider-specific ID
    if (providerId) {
      const existingByProvider = await this.usersRepository.findOne({
        where: { [providerIdField]: providerId } as any,
        relations: ["role"],
      });
      if (existingByProvider) {
        return existingByProvider;
      }
    }

    // 2. Try to find user by email and link the provider
    if (oauthUser.email) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: oauthUser.email },
        relations: ["role"],
      });
      if (existingByEmail) {
        (existingByEmail as any)[providerIdField] = providerId;
        existingByEmail.isVerified = true;
        return this.usersRepository.save(existingByEmail);
      }
    }

    // 3. Create a new user
    const role = await this.rolesRepository.findOne({ where: { name: UserRole.USER } });
    if (!role) {
      throw new Error("Default user role not found. Please seed roles.");
    }

    const userData: DeepPartial<User> = {
      email: oauthUser.email,
      isVerified: true,
      role,
    };
    (userData as Record<string, unknown>)[providerIdField as string] = providerId;

    const newUser = this.usersRepository.create(userData);

    return this.usersRepository.save(newUser);
  }

  // Two-Factor Authentication Methods
  async generateTwoFactorSecret(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException("2FA is already enabled for this user");
    }

    const secret = generateSecret();
    const otpauthUrl = `otpauth://totp/Quest%20Service:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Quest%20Service`;
    
    // Store the secret temporarily (not enabling 2FA yet)
    user.twoFactorSecret = secret;
    await this.usersRepository.save(user);

    const qrCodeDataUri = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeDataUri,
    };
  }

  async verifyTwoFactorSetup(userId: string, code: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException("2FA secret not generated. Call setup endpoint first.");
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException("2FA is already enabled for this user");
    }

    const isValid = verify({
      secret: user.twoFactorSecret,
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid TOTP code");
    }

    // Enable 2FA and generate backup codes
    user.isTwoFactorEnabled = true;
    await this.usersRepository.save(user);

    // Generate and hash backup codes
    const backupCodes = await this.generateBackupCodes(userId);

    return {
      message: "2FA enabled successfully",
      backupCodes,
    };
  }

  async disableTwoFactor(userId: string, code: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ["id", "email", "password", "twoFactorSecret", "isTwoFactorEnabled"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException("2FA is not enabled for this user");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Verify TOTP code
    const isValid = verify({
      secret: user.twoFactorSecret!,
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid TOTP code");
    }

    // Disable 2FA
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.usersRepository.save(user);

    // Invalidate all backup codes
    await this.backupCodesRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    return { message: "2FA disabled successfully" };
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ["id", "twoFactorSecret", "isTwoFactorEnabled"],
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException("2FA is not enabled for this user");
    }

    // First check if it's a backup code
    const backupCode = await this.backupCodesRepository.findOne({
      where: { userId: user.id, codeHash: await bcrypt.hash(code, BCRYPT_SALT_ROUNDS), isUsed: false },
    });

    if (backupCode) {
      // Mark backup code as used
      backupCode.isUsed = true;
      backupCode.usedAt = new Date();
      await this.backupCodesRepository.save(backupCode);
      return true;
    }

    // Verify TOTP code
    const isValid = verify({
      secret: user.twoFactorSecret,
      token: code,
    });

    return !!isValid;
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    // Generate 8 random backup codes
    const codes = Array.from({ length: 8 }, () => uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase());

    // Hash and store each code
    for (const code of codes) {
      const hashedCode = await bcrypt.hash(code, BCRYPT_SALT_ROUNDS);
      const backupCode = this.backupCodesRepository.create({
        codeHash: hashedCode,
        userId,
      });
      await this.backupCodesRepository.save(backupCode);
    }

    return codes;
  }

  async getTwoFactorStatus(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException("2FA must be enabled to regenerate backup codes");
    }

    // Invalidate old backup codes
    await this.backupCodesRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    // Generate new backup codes
    return this.generateBackupCodes(userId);
  }
}
