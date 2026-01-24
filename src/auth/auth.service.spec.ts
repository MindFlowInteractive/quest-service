import { Test, type TestingModule } from "@nestjs/testing"
import { AuthService } from "./auth.service"
import { getRepositoryToken } from "@nestjs/typeorm"
import { User } from "./entities/user.entity"
import { Role } from "./entities/role.entity"
import { RefreshToken } from "./entities/refresh-token.entity"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import type { Repository } from "typeorm"
import { ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common"
import { UserRole } from "./constants"
import { jest } from "@jest/globals" // Import jest to declare it

// Mock TypeORM Repositories
const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
})

const mockRoleRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
})

const mockRefreshTokenRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
})

// Mock JwtService
const mockJwtService = () => ({
  sign: jest.fn(() => "mockAccessToken"),
  verify: jest.fn(),
})

describe("AuthService", () => {
  let service: AuthService
  let userRepository: Repository<User>
  let roleRepository: Repository<Role>
  let refreshTokenRepository: Repository<RefreshToken>
  let jwtService: JwtService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: getRepositoryToken(Role), useFactory: mockRoleRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRefreshTokenRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role))
    refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken))
    jwtService = module.get<JwtService>(JwtService)

    // Mock bcrypt.hash and bcrypt.compare
    jest.spyOn(bcrypt, "hash").mockImplementation((password: string) => Promise.resolve(`hashed_${password}`))
    jest
      .spyOn(bcrypt, "compare")
      .mockImplementation((password: string, hash: string) => Promise.resolve(`hashed_${password}` === hash))
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("register", () => {
    it("should successfully register a user", async () => {
      const registerDto = { email: "test@example.com", password: "password123", roleName: UserRole.USER }
      const mockRole = { id: 1, name: UserRole.USER, description: "Standard user role" }
      const mockUser = {
        id: "uuid-1",
        email: registerDto.email,
        isVerified: false,
        role: mockRole,
        verificationToken: "mock-token",
      }

      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)
      jest.spyOn(roleRepository, "findOne").mockResolvedValue(mockRole)
      jest.spyOn(userRepository, "create").mockReturnValue(mockUser)
      jest.spyOn(userRepository, "save").mockResolvedValue(mockUser)

      const result = await service.register(registerDto)
      expect(result).toEqual({
        message: "User registered successfully. Please verify your email.",
        userId: mockUser.id,
      })
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: registerDto.email, password: `hashed_${registerDto.password}` }),
      )
    })

    it("should throw ConflictException if user already exists", async () => {
      const registerDto = { email: "test@example.com", password: "password123" }
      jest.spyOn(userRepository, "findOne").mockResolvedValue({ email: "test@example.com" } as User)

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("login", () => {
    it("should successfully log in a user and return tokens", async () => {
      const loginDto = { email: "test@example.com", password: "password123" }
      const mockUser = {
        id: "uuid-1",
        email: loginDto.email,
        password: "hashed_password123",
        isVerified: true,
        role: { name: UserRole.USER },
      } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true)
      jest.spyOn(refreshTokenRepository, "create").mockReturnValue({} as RefreshToken)
      jest.spyOn(refreshTokenRepository, "save").mockResolvedValue({} as RefreshToken)

      const result = await service.login(loginDto)
      expect(result).toEqual({ accessToken: "mockAccessToken", refreshToken: expect.any(String) })
      expect(jwtService.sign).toHaveBeenCalled()
    })

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const loginDto = { email: "test@example.com", password: "wrongpassword" }
      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it("should throw UnauthorizedException if email is not verified", async () => {
      const loginDto = { email: "test@example.com", password: "password123" }
      const mockUser = {
        id: "uuid-1",
        email: loginDto.email,
        password: "hashed_password123",
        isVerified: false,
      } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ select: expect.arrayContaining(["password"]) }),
      )
    })
  })

  describe("verifyEmail", () => {
    it("should successfully verify email", async () => {
      const verifyDto = { token: "mock-token" }
      const mockUser = {
        id: "uuid-1",
        email: "test@example.com",
        isVerified: false,
        verificationToken: "mock-token",
      } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)
      jest.spyOn(userRepository, "save").mockResolvedValue({ ...mockUser, isVerified: true, verificationToken: undefined })

      const result = await service.verifyEmail(verifyDto)
      expect(result).toEqual({ message: "Email verified successfully." })
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: true, verificationToken: undefined }),
      )
    })

    it("should throw BadRequestException for invalid token", async () => {
      const verifyDto = { token: "invalid-token" }
      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("forgotPassword", () => {
    it("should send password reset link if user exists", async () => {
      const forgotDto = { email: "test@example.com" }
      const mockUser = { id: "uuid-1", email: "test@example.com" } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)
      jest.spyOn(userRepository, "save").mockResolvedValue(mockUser)

      const result = await service.forgotPassword(forgotDto)
      expect(result).toEqual({ message: "If a user with that email exists, a password reset link has been sent." })
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ resetPasswordToken: expect.any(String), resetPasswordExpires: expect.any(Date) }),
      )
    })

    it("should return generic message if user does not exist", async () => {
      const forgotDto = { email: "nonexistent@example.com" }
      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)

      const result = await service.forgotPassword(forgotDto)
      expect(result).toEqual({ message: "If a user with that email exists, a password reset link has been sent." })
      expect(userRepository.save).not.toHaveBeenCalled()
    })
  })

  describe("resetPassword", () => {
    it("should successfully reset password", async () => {
      const resetDto = { token: "mock-reset-token", newPassword: "newpassword123" }
      const mockUser = {
        id: "uuid-1",
        email: "test@example.com",
        resetPasswordToken: "mock-reset-token",
        resetPasswordExpires: new Date(Date.now() + 3600000),
      } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...mockUser,
        password: "hashed_newpassword123",
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      })

      const result = await service.resetPassword(resetDto)
      expect(result).toEqual({ message: "Password has been reset successfully." })
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "hashed_newpassword123",
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined,
        }),
      )
    })

    it("should throw BadRequestException for invalid or expired token", async () => {
      const resetDto = { token: "invalid-token", newPassword: "newpassword123" }
      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)

      await expect(service.resetPassword(resetDto)).rejects.toThrow(BadRequestException)

      const expiredUser = {
        id: "uuid-1",
        email: "test@example.com",
        resetPasswordToken: "expired-token",
        resetPasswordExpires: new Date(Date.now() - 1000),
      } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValue(expiredUser)
      await expect(service.resetPassword({ token: "expired-token", newPassword: "newpassword123" })).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe("refreshToken", () => {
    it("should generate new tokens if refresh token is valid", async () => {
      const userId = "uuid-1"
      const oldRefreshToken = "old-refresh-token"
      const mockUser = { id: userId, email: "test@example.com", role: { name: UserRole.USER } } as User
      const mockExistingToken = {
        token: oldRefreshToken,
        expiresAt: new Date(Date.now() + 3600000),
        isRevoked: false,
        user: mockUser,
        userId: userId,
      } as RefreshToken

      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(mockExistingToken)
      jest.spyOn(refreshTokenRepository, "save").mockResolvedValue({ ...mockExistingToken, isRevoked: true })
      jest.spyOn(refreshTokenRepository, "create").mockReturnValue({} as RefreshToken) // For new token creation

      const result = await service.refreshToken(userId, oldRefreshToken)
      expect(result).toEqual({ accessToken: "mockAccessToken", refreshToken: expect.any(String) })
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true }))
      expect(jwtService.sign).toHaveBeenCalled()
    })

    it("should throw UnauthorizedException if refresh token is invalid or expired", async () => {
      const userId = "uuid-1"
      const oldRefreshToken = "invalid-refresh-token"

      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(undefined)
      await expect(service.refreshToken(userId, oldRefreshToken)).rejects.toThrow(UnauthorizedException)

      const expiredToken = {
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000),
        isRevoked: false,
        userId: userId,
      } as RefreshToken
      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(expiredToken)
      jest.spyOn(service, "revokeAllRefreshTokensForUser").mockResolvedValue(undefined) // Mock this to prevent actual DB call
      await expect(service.refreshToken(userId, "expired-token")).rejects.toThrow(UnauthorizedException)
      expect(service.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(userId)
    })
  })

  describe("logout", () => {
    it("should revoke the refresh token and log out", async () => {
      const userId = "uuid-1"
      const refreshToken = "valid-refresh-token"
      const mockToken = { userId, token: refreshToken, isRevoked: false } as RefreshToken

      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(mockToken)
      jest.spyOn(refreshTokenRepository, "save").mockResolvedValue({ ...mockToken, isRevoked: true })

      const result = await service.logout(userId, refreshToken)
      expect(result).toEqual({ message: "Logged out successfully." })
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true }))
    })

    it("should throw BadRequestException if refresh token not found or already revoked", async () => {
      const userId = "uuid-1"
      const refreshToken = "invalid-refresh-token"

      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(undefined)
      await expect(service.logout(userId, refreshToken)).rejects.toThrow(BadRequestException)
    })
  })

  describe("validateUserById", () => {
    it("should return user if found and verified", async () => {
      const userId = "uuid-1"
      const mockUser = {
        id: userId,
        email: "test@example.com",
        isVerified: true,
        role: { name: UserRole.USER },
      } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)

      const result = await service.validateUserById(userId)
      expect(result).toEqual(mockUser)
    })

    it("should return undefined if user not found or not verified", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(undefined)
      expect(await service.validateUserById("non-existent")).toBeNull()

      const unverifiedUser = { id: "uuid-2", email: "unverified@example.com", isVerified: false } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValue(unverifiedUser)
      expect(await service.validateUserById("uuid-2")).toBeNull()
    })
  })

  describe("validateRefreshToken", () => {
    it("should return true if refresh token is valid and not revoked", async () => {
      const userId = "uuid-1"
      const token = "valid-token"
      const mockToken = { userId, token, isRevoked: false, expiresAt: new Date(Date.now() + 10000) } as RefreshToken
      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(mockToken)

      expect(await service.validateRefreshToken(userId, token)).toBe(true)
    })

    it("should return false if refresh token is invalid, revoked, or expired", async () => {
      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(undefined)
      expect(await service.validateRefreshToken("uuid-1", "invalid-token")).toBe(false)

      const revokedToken = {
        userId: "uuid-1",
        token: "revoked-token",
        isRevoked: true,
        expiresAt: new Date(Date.now() + 10000),
      } as RefreshToken
      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(revokedToken)
      expect(await service.validateRefreshToken("uuid-1", "revoked-token")).toBe(false)

      const expiredToken = {
        userId: "uuid-1",
        token: "expired-token",
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000),
      } as RefreshToken
      jest.spyOn(refreshTokenRepository, "findOne").mockResolvedValue(expiredToken)
      expect(await service.validateRefreshToken("uuid-1", "expired-token")).toBe(false)
    })
  })

  describe("findOrCreateOAuthUser", () => {
    it("should find and return an existing OAuth user", async () => {
      const oauthUser = { email: "google@example.com", googleId: "google-id-1" }
      const mockUser = { id: "uuid-1", email: oauthUser.email, googleId: oauthUser.googleId, isVerified: true } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser)

      const result = await service.findOrCreateOAuthUser("google", oauthUser)
      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { googleId: oauthUser.googleId } })
    })

    it("should link an existing email account to OAuth", async () => {
      const oauthUser = { email: "existing@example.com", googleId: "google-id-2" }
      const existingUserByEmail = { id: "uuid-2", email: oauthUser.email, isVerified: false } as User

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValueOnce(undefined) // No user by googleId
        .mockResolvedValueOnce(existingUserByEmail) // User found by email
      jest
        .spyOn(userRepository, "save")
        .mockResolvedValue({ ...existingUserByEmail, googleId: oauthUser.googleId, isVerified: true })

      const result = await service.findOrCreateOAuthUser("google", oauthUser)
      expect(result.googleId).toBe(oauthUser.googleId)
      expect(result.isVerified).toBe(true)
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: oauthUser.googleId, isVerified: true }),
      )
    })

    it("should create a new user for OAuth", async () => {
      const oauthUser = { email: "newoauth@example.com", githubId: "github-id-1" }
      const mockRole = { id: 1, name: UserRole.USER } as Role
      const newOAuthUser = {
        id: "uuid-3",
        email: oauthUser.email,
        githubId: oauthUser.githubId,
        isVerified: true,
        role: mockRole,
      } as User

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValueOnce(undefined) // No user by githubId
        .mockResolvedValueOnce(undefined) // No user by email
      jest.spyOn(roleRepository, "findOne").mockResolvedValue(mockRole)
      jest.spyOn(userRepository, "create").mockReturnValue(newOAuthUser)
      jest.spyOn(userRepository, "save").mockResolvedValue(newOAuthUser)

      const result = await service.findOrCreateOAuthUser("github", oauthUser)
      expect(result).toEqual(newOAuthUser)
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: oauthUser.email, githubId: oauthUser.githubId, isVerified: true }),
      )
    })

    it("should throw error if default user role not found when creating new user", async () => {
      const oauthUser = { email: "newoauth@example.com", githubId: "github-id-1" }

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValueOnce(undefined as any) // No user by githubId
        .mockResolvedValueOnce(undefined as any) // No user by email
      jest.spyOn(roleRepository, "findOne").mockResolvedValue(undefined as any) // No default role

      await expect(service.findOrCreateOAuthUser("github", oauthUser)).rejects.toThrow(
        "Default user role not found. Please seed roles.",
      )
    })
  })
})
