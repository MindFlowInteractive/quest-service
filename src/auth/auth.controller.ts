import { Controller, Post, HttpCode, HttpStatus, UseGuards, Get } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import { RegisterUserDto } from "./dto/register-user.dto"
import { LoginUserDto } from "./dto/login-user.dto"
import { ForgotPasswordDto } from "./dto/forgot-password.dto"
import { ResetPasswordDto } from "./dto/reset-password.dto"
import { VerifyEmailDto } from "./dto/verify-email.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { RefreshJwtAuthGuard } from "./guards/refresh-jwt-auth.guard"
import type { RequestWithUser } from "./interfaces/request-with-user.interface"
import { Roles } from "./decorators/roles.decorator"
import { RolesGuard } from "./guards/roles.guard"
import { UserRole } from "./constants"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from "@nestjs/swagger"

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully. Email verification link sent." })
  @ApiResponse({ status: 409, description: "User with this email already exists." })
  @ApiBody({
    type: RegisterUserDto,
    examples: {
      "User Registration": { value: { email: "test@example.com", password: "password123", roleName: "user" } },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async register(registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto)
  }

  @Post("login")
  @ApiOperation({ summary: "Log in a user and get JWT tokens" })
  @ApiResponse({
    status: 200,
    description: "User logged in successfully",
    schema: { example: { accessToken: "...", refreshToken: "..." } },
  })
  @ApiResponse({ status: 401, description: "Invalid credentials or email not verified." })
  @ApiBody({
    type: LoginUserDto,
    examples: { "User Login": { value: { email: "test@example.com", password: "password123" } } },
  })
  @HttpCode(HttpStatus.OK)
  async login(loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto)
  }

  @Post("verify-email")
  @ApiOperation({ summary: "Verify user email with a token" })
  @ApiResponse({ status: 200, description: "Email verified successfully." })
  @ApiResponse({ status: 400, description: "Invalid or expired verification token." })
  @ApiBody({ type: VerifyEmailDto, examples: { "Verify Email": { value: { token: "your-verification-token" } } } })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto)
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password reset link" })
  @ApiResponse({ status: 200, description: "Password reset link sent if email exists." })
  @ApiBody({ type: ForgotPasswordDto, examples: { "Forgot Password": { value: { email: "test@example.com" } } } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset user password using a token" })
  @ApiResponse({ status: 200, description: "Password has been reset successfully." })
  @ApiResponse({ status: 400, description: "Invalid or expired password reset token." })
  @ApiBody({
    type: ResetPasswordDto,
    examples: { "Reset Password": { value: { token: "your-reset-token", newPassword: "newPassword123" } } },
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto)
  }

  @Post("refresh-token")
  @ApiOperation({ summary: "Refresh access token using a valid refresh token" })
  @ApiResponse({
    status: 200,
    description: "New access and refresh tokens generated.",
    schema: { example: { accessToken: "...", refreshToken: "..." } },
  })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token." })
  @ApiBody({
    schema: { type: "object", properties: { refreshToken: { type: "string", example: "your-refresh-token" } } },
  })
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(req: RequestWithUser, refreshToken: string) {
    // The RefreshJwtAuthGuard already validated the refresh token and attached user to req.user
    return this.authService.refreshToken(req.user.id, refreshToken)
  }

  @Post("logout")
  @ApiOperation({ summary: "Log out a user by revoking refresh token" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Logged out successfully." })
  @ApiResponse({ status: 400, description: "Refresh token not found or already revoked." })
  @ApiBody({
    schema: { type: "object", properties: { refreshToken: { type: "string", example: "your-refresh-token" } } },
  })
  @UseGuards(JwtAuthGuard) // Protect this endpoint with access token
  @HttpCode(HttpStatus.OK)
  async logout(req: RequestWithUser, refreshToken: string) {
    // Invalidate the specific refresh token used for this session
    return this.authService.logout(req.user.id, refreshToken)
  }

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "User profile data.",
    schema: { example: { userId: "uuid", email: "test@example.com", roles: ["user"] } },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(req: RequestWithUser) {
    // req.user contains the payload from JwtStrategy
    return req.user
  }

  @Get("admin-data")
  @ApiOperation({ summary: "Get sensitive admin data (requires ADMIN role)" })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Admin data.",
    schema: { example: { message: "Welcome, Admin test@example.com! This is sensitive data." } },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden (insufficient roles)." })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  getAdminData(req: RequestWithUser) {
    return { message: `Welcome, Admin ${req.user.email}! This is sensitive data.` }
  }

  // OAuth2 Google Login
  @Get("google")
  @ApiOperation({ summary: "Initiate Google OAuth2 login" })
  @ApiResponse({ status: 302, description: "Redirects to Google for authentication." })
  @UseGuards(AuthGuard("google"))
  async googleAuth(req) {
    // Initiates the Google OAuth2 login flow
  }

  @Get("google/callback")
  @ApiOperation({ summary: "Google OAuth2 callback endpoint" })
  @ApiResponse({
    status: 200,
    description: "Google authentication successful, returns JWT tokens.",
    schema: {
      example: {
        message: "Google authentication successful",
        user: { id: "uuid", email: "google@example.com", isVerified: true, role: "user" },
        accessToken: "...",
        refreshToken: "...",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Google authentication failed." })
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(req: RequestWithUser) {
    // This endpoint is hit after Google authenticates the user
    // req.user will contain the user object returned by GoogleStrategy's validate method
    const user = req.user
    // Generate JWT tokens for the OAuth user
    const tokens = await this.authService.generateTokens(user)
    return {
      message: "Google authentication successful",
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role?.name,
      },
      ...tokens,
    }
  }

  // GitHub OAuth similarly
  @Get("github")
  @UseGuards(AuthGuard("github"))
  async githubAuth(req) {}

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  async githubAuthRedirect(req: RequestWithUser) {
    const user = req.user
    const tokens = await this.authService.generateTokens(user)
    return {
      message: "GitHub authentication successful",
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role?.name,
      },
      ...tokens,
    }
  }
}
