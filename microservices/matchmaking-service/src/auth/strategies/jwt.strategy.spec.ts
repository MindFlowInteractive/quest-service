import { JwtStrategy } from "./jwt.strategy"
import type { AuthService } from "../auth.service"
import { UserRole } from "../constants"
import type { User } from "../entities/user.entity"
import { jest } from "@jest/globals" // Declare the jest variable

describe("JwtStrategy", () => {
  let jwtStrategy: JwtStrategy
  let authService: AuthService

  beforeEach(() => {
    authService = {
      validateUserById: jest.fn(),
    } as unknown as AuthService // Cast to AuthService
    jwtStrategy = new JwtStrategy(authService)
  })

  it("should be defined", () => {
    expect(jwtStrategy).toBeDefined()
  })

  describe("validate", () => {
    it("should return user payload if user is valid", async () => {
      const payload = { sub: "user-id-1", email: "test@example.com", roles: [UserRole.USER] }
      const mockUser = {
        id: "user-id-1",
        email: "test@example.com",
        isVerified: true,
        role: { name: UserRole.USER },
      } as User
      jest.spyOn(authService, "validateUserById").mockResolvedValue(mockUser)

      const result = await jwtStrategy.validate(payload)
      expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub)
      expect(result).toEqual({ userId: payload.sub, email: payload.email, roles: payload.roles })
    })

    it("should return null if user is not found or not verified", async () => {
      const payload = { sub: "invalid-id", email: "invalid@example.com", roles: [] }
      jest.spyOn(authService, "validateUserById").mockResolvedValue(null)

      const result = await jwtStrategy.validate(payload)
      expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub)
      expect(result).toBeNull() // Passport will throw UnauthorizedException if validate returns null
    })
  })
})
