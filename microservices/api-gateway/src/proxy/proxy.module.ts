import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { RouteResolverService } from './route-resolver.service';
import { CustomThrottlerGuard } from './custom-throttler.guard';

@Module({
    controllers: [ProxyController],
    providers: [ProxyService, RouteResolverService, CustomThrottlerGuard],
    exports: [ProxyService],
})
export class ProxyModule { }
