import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    getServiceByPrefix,
    stripPrefix,
} from '../config/services.config';

@Injectable()
export class RouteResolverService {
    private readonly logger = new Logger(RouteResolverService.name);

    constructor(private configService: ConfigService) { }

    resolveRoute(path: string): {
        serviceName: string;
        targetUrl: string;
        targetPath: string;
    } | null {
        const services = this.configService.get('services');
        const match = getServiceByPrefix(services, path);

        if (!match) {
            this.logger.warn(`No service found for path: ${path}`);
            return null;
        }

        const targetPath = stripPrefix(path, match.config.prefix);
        const targetUrl = match.config.url;

        this.logger.debug(
            `Resolved route: ${path} -> ${match.name} (${targetUrl}${targetPath})`,
        );

        return {
            serviceName: match.name,
            targetUrl,
            targetPath,
        };
    }
}
