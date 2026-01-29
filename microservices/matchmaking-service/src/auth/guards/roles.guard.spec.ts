import { RolesGuard } from "./roles.guard"
import { Reflector } from "@nestjs/core"
import type { ExecutionContext } from "@nestjs/common"
import { UserRole } from "../constants"
import type { User } from "../entities/user.entity"
import type { Role } from "../entities/role.entity"
import { jest } from "@jest/globals"

describe("RolesGuard", () => {
  let guard: RolesGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new RolesGuard(reflector)
  })

  it("should be defined", () => {
    expect(guard).toBeDefined()
  })

  it("should return true if no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined)
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(true)
  })

  it("should return true if user has the required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN])
    const mockUser = {
      id: "user-id",
      email: "admin@example.com",
      role: { name: UserRole.ADMIN } as Role,
    } as User
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(true)
  })

  it("should return false if user does not have the required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN])
    const mockUser = {
      id: "user-id",
      email: "user@example.com",
      role: { name: UserRole.USER } as Role,
    } as User
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)
  })

  it("should return false if user object is missing", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN])
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}), // No user object
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)
  })

  it("should return false if user role is missing", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN])
    const mockUser = {
      id: "user-id",
      email: "user@example.com",
      // role is missing
    } as User
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)
  })

  it("should return false if user role name is missing", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN])
    const mockUser = {
      id: "user-id",
      email: "user@example.com",
      role: {} as Role, // role name is missing
    } as User
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)
  })

  it("should return true if user has one of multiple required roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN, UserRole.MODERATOR])
    const mockUser = {
      id: "user-id",
      email: "mod@example.com",
      role: { name: UserRole.MODERATOR } as Role,
    } as User
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(true)
  })
})
