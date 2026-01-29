export const jwtConstants = {
  secret: process.env.JWT_SECRET || "yourSuperSecretKey", // CHANGE THIS IN PRODUCTION
  accessExpiresIn: "15m", // Access token expiry
  refreshExpiresIn: "7d", // Refresh token expiry
  emailVerificationExpiresIn: "1h", // Email verification token expiry
  passwordResetExpiresIn: "1h", // Password reset token expiry
}

export const BCRYPT_SALT_ROUNDS = 10

export const ROLES_KEY = 'roles'

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
  ANALYST = "analyst",
}
