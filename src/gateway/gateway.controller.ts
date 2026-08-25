import {
  All,
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All(':service/*path')
  @HttpCode(200)
  async proxyRequest(
    @Param('service') service: string,
    @Param('path') path: string,
    @Req() request: Request,
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.gatewayService.forwardRequest({
      service,
      path,
      method: request.method,
      body,
      query,
      headers,
    });
  }
}
