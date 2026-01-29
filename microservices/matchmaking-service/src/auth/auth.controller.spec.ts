import { Test, type TestingModule } from "@nestjs/testing"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import type { RegisterUserDto } from "./dto/register-user.dto"
import type { LoginUserDto } from "./dto/login-user.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"
import type { VerifyEmailDto } from "./dto/verify-email.dto"
import { UnauthorizedException } from "@nestjs/common"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { RefreshJwtAuthGuard } from "./guards/refresh-jwt-auth.guard"
import { RolesGuard } from "./guards/roles.guard"
import { UserRole } from "./constants"
import { Reflector } from "@nestjs/core"
import { AuthGuard } from "@nestjs/passport"
import * as request from "supertest"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { SwaggerModule } from "@nestjs/swagger"
import { createSwaggerConfig } from "../swagger.config" // Import the new config
import { jest } from "@jest/globals" // Declare the jest variable

// Mock AuthService
const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  validateUserById: jest.fn(),
  findOrCreateOAuthUser: jest.fn(),
  generateTokens: jest.fn(),
})

// Mock Guards
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
const mockRefreshJwtAuthGuard = { canActivate: jest.fn(() => true) }
const mockRolesGuard = { canActivate: jest.fn(() => true) }
const mockGoogleAuthGuard = { canActivate: jest.fn(() => true) }

describe("AuthController", () => {
  let controller: AuthController
  let service: ReturnType<typeof mockAuthService>
  let app: INestApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useFactory: mockAuthService },
        { provide: JwtAuthGuard, useValue: mockJwtAuthGuard },
        { provide: RefreshJwtAuthGuard, useValue: mockRefreshJwtAuthGuard },
        { provide: RolesGuard, useValue: mockRolesGuard },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn(() => []) } }, // Mock Reflector for RolesGuard
        { provide: AuthGuard("google"), useValue: mockGoogleAuthGuard }, // Mock Google AuthGuard
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)

    // Create a NestJS application instance for testing Swagger
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

    // Setup Swagger for the test app
    const config = createSwaggerConfig()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup("api-docs", app, document)

    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("Swagger UI Accessibility", () => {
    it("should serve Swagger UI at /api-docs", async () => {
      const response = await request(app.getHttpServer()).get("/api-docs")
      expect(response.statusCode).toBe(200)
      expect(response.text).toContain("swagger-ui")
    })

    it("should serve Swagger JSON at /api-docs-json", async () => {
      const response = await request(app.getHttpServer()).get("/api-docs-json")
      expect(response.statusCode).toBe(200)
      expect(response.headers["content-type"]).toContain("application/json")
      expect(response.body.info.title).toBe("NestJS Authentication API")
      expect(response.body.paths["/auth/register"]).toBeDefined()
    })
  })

  describe("register", () => {
    it("should call authService.register and return success message", async () => {
      const registerDto: RegisterUserDto = { email: "test@example.com", password: "password123" }
      service.register.mockResolvedValue({ message: "User registered successfully.", userId: "uuid-1" })

      const result = await controller.register(registerDto)
      expect(service.register).toHaveBeenCalledWith(registerDto)
      expect(result).toEqual({ message: "User registered successfully.", userId: "uuid-1" })
    })
  })

  describe("login", () => {
    it("should call authService.login and return tokens", async () => {
      const loginDto: LoginUserDto = { email: "test@example.com", password: "password123" }
      const tokens = { accessToken: "access", refreshToken: "refresh" }
      service.login.mockResolvedValue(tokens)

      const result = await controller.login(loginDto)
      expect(service.login).toHaveBeenCalledWith(loginDto)
      expect(result).toEqual(tokens)
    })
  })

  describe("verifyEmail", () => {
    it("should call authService.verifyEmail and return success message", async () => {
      const verifyDto: VerifyEmailDto = { token: "mock-token" }
      service.verifyEmail.mockResolvedValue({ message: "Email verified successfully." })

      const result = await controller.verifyEmail(verifyDto)
      expect(service.verifyEmail).toHaveBeenCalledWith(verifyDto)
      expect(result).toEqual({ message: "Email verified successfully." })
    })
  })

  describe("forgotPassword", () => {
    it("should call authService.forgotPassword and return success message", async () => {
      const forgotDto: ForgotPasswordDto = { email: "test@example.com" }
      service.forgotPassword.mockResolvedValue({
        message: "If a user with that email exists, a password reset link has been sent.",
      })

      const result = await controller.forgotPassword(forgotDto)
      expect(service.forgotPassword).toHaveBeenCalledWith(forgotDto)
      expect(result).toEqual({ message: "If a user with that email exists, a password reset link has been sent." })
    })
  })

  describe("resetPassword", () => {
    it("should call authService.resetPassword and return success message", async () => {
      const resetDto: ResetPasswordDto = { token: "mock-token", newPassword: "newpassword123" }
      service.resetPassword.mockResolvedValue({ message: "Password has been reset successfully." })

      const result = await controller.resetPassword(resetDto)
      expect(service.resetPassword).toHaveBeenCalledWith(resetDto)
      expect(result).toEqual({ message: "Password has been reset successfully." })
    })
  })

  describe("refreshToken", () => {
    it("should call authService.refreshToken and return new tokens", async () => {
      const req = { user: { userId: "uuid-1" } } as any
      const refreshToken = "old-refresh-token"
      const newTokens = { accessToken: "new-access", refreshToken: "new-refresh" }
      service.refreshToken.mockResolvedValue(newTokens)
      mockRefreshJwtAuthGuard.canActivate.mockReturnValue(true) // Ensure guard passes

      const result = await controller.refreshToken(req, refreshToken)
      expect(service.refreshToken).toHaveBeenCalledWith(req.user.userId, refreshToken)
      expect(result).toEqual(newTokens)
    })
  })

  describe("logout", () => {
    it("should call authService.logout and return success message", async () => {
      const req = { user: { userId: "uuid-1" } } as any
      const refreshToken = "valid-refresh-token"
      service.logout.mockResolvedValue({ message: "Logged out successfully." })
      mockJwtAuthGuard.canActivate.mockReturnValue(true) // Ensure guard passes

      const result = await controller.logout(req, refreshToken)
      expect(service.logout).toHaveBeenCalledWith(req.user.userId, refreshToken)
      expect(result).toEqual({ message: "Logged out successfully." })
    })
  })

  describe("getProfile", () => {
    it("should return user profile from request", async () => {
      const req = { user: { userId: "uuid-1", email: "test@example.com", roles: ["user"] } } as any
      mockJwtAuthGuard.canActivate.mockReturnValue(true) // Ensure guard passes

      const result = controller.getProfile(req)
      expect(result).toEqual(req.user)
    })
  })

  describe("getAdminData", () => {
    it("should return admin data for admin user", async () => {
      const req = { user: { userId: "uuid-1", email: "admin@example.com", roles: [UserRole.ADMIN] } } as any
      mockJwtAuthGuard.canActivate.mockReturnValue(true)
      mockRolesGuard.canActivate.mockReturnValue(true) // Ensure roles guard passes

      const result = controller.getAdminData(req)
      expect(result).toEqual({ message: `Welcome, Admin ${req.user.email}! This is sensitive data.` })
    })

    it("should throw UnauthorizedException if not authenticated", async () => {
      mockJwtAuthGuard.canActivate.mockReturnValue(false) // Simulate failed JWT auth
      mockRolesGuard.canActivate.mockReturnValue(true)

      const req = { user: {} } as any // User object won't be populated
      await expect(controller.getAdminData(req)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe("googleAuthRedirect", () => {
    it("should generate tokens for authenticated Google user", async () => {
      const mockUser = {
        id: "google-user-id",
        email: "google@example.com",
        isVerified: true,
        role: { name: UserRole.USER },
      }
      const mockTokens = { accessToken: "google-access", refreshToken: "google-refresh" }
      const req = { user: mockUser } as any

      mockGoogleAuthGuard.canActivate.mockReturnValue(true)
      service.generateTokens.mockResolvedValue(mockTokens)

      const result = await controller.googleAuthRedirect(req)
      expect(service.generateTokens).toHaveBeenCalledWith(mockUser)
      expect(result).toEqual({
        message: "Google authentication successful",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          isVerified: mockUser.isVerified,
          role: mockUser.role.name,
        },
        ...mockTokens,
      })
    })
  })
})
