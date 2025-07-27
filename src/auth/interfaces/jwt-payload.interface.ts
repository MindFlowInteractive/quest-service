export interface JwtPayload {
  sub: string // User ID
  email: string
  roles: string[]
}
