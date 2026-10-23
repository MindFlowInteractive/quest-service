import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { RouteResolverService } from './route-resolver.service';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { ReconnectGraceService } from './reconnect-grace.service';

@Module({
    controllers: [ProxyController],
    providers: [
        ProxyService,
        RouteResolverService,
        CustomThrottlerGuard,
        ReconnectGraceService,
    ],
    exports: [ProxyService, ReconnectGraceService],
})
export class ProxyModule { }
