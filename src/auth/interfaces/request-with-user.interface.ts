import type { Request } from "express"
import type { User } from "../entities/user.entity"

export interface RequestWithUser extends Request {
  user: User
}
