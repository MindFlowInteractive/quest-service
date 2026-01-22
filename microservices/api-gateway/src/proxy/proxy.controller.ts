import {
    Controller,
    All,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { LoggingInterceptor } from '../logging/logging.interceptor';
import { ProxyService } from './proxy.service';

@Controller()
@UseGuards(JwtAuthGuard, CustomThrottlerGuard)
@UseInterceptors(LoggingInterceptor)
export class ProxyController {
    constructor(private proxyService: ProxyService) { }

    @All('*')
    async handleRequest(@Req() req: Request, @Res() res: Response) {
        await this.proxyService.forwardRequest(req, res);
    }
}
