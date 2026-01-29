import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { ROLES_KEY, type UserRole } from "../constants"
import type { RequestWithUser } from "../interfaces/request-with-user.interface"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true // No roles specified, allow access
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>()

    // Ensure user and user.role exist
    if (!user || !user.role || !user.role.name) {
      return false
    }

    // Check if the user's role is among the required roles
    return requiredRoles.some((role) => user.role.name === role)
  }
}
