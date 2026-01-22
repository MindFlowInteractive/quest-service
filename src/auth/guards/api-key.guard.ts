import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    return req.headers['x-api-key'] === process.env.EXTERNAL_API_KEY;
  }
}
