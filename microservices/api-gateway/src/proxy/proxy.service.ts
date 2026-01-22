import {
    Injectable,
    Logger,
    BadGatewayException,
    NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { LoadBalancerService } from '../load-balancer/load-balancer.service';
import { RouteResolverService } from './route-resolver.service';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(
        private circuitBreaker: CircuitBreakerService,
        private loadBalancer: LoadBalancerService,
        private routeResolver: RouteResolverService,
    ) { }

    async forwardRequest(req: Request, res: Response): Promise<void> {
        const route = this.routeResolver.resolveRoute(req.path);

        if (!route) {
            throw new NotFoundException('Service not found for this route');
        }

        const serviceUrl = this.loadBalancer.getNextInstance(route.serviceName);

        if (!serviceUrl) {
            throw new BadGatewayException(
                `No healthy instances available for ${route.serviceName}`,
            );
        }

        const targetUrl = `${serviceUrl}${route.targetPath}`;
        const correlationId = req['correlationId'];

        const config: AxiosRequestConfig = {
            method: req.method as any,
            url: targetUrl,
            headers: this.prepareHeaders(req, correlationId),
            params: req.query,
            data: req.body,
            timeout: 30000,
        };

        try {
            this.logger.debug(
                `Forwarding ${req.method} ${req.path} -> ${targetUrl} [${correlationId}]`,
            );

            const response = await this.circuitBreaker.execute(
                route.serviceName,
                config,
            );

            this.sendResponse(res, response);
        } catch (error) {
            this.logger.error(
                `Proxy error for ${route.serviceName}: ${error.message}`,
            );

            if (error.response) {
                this.sendResponse(res, error.response);
            } else {
                throw new BadGatewayException(
                    `Failed to communicate with ${route.serviceName}`,
                );
            }
        }
    }

    private prepareHeaders(req: Request, correlationId: string): any {
        const headers = { ...req.headers };

        delete headers.host;
        delete headers.connection;
        delete headers['content-length'];

        headers['x-correlation-id'] = correlationId;
        headers['x-forwarded-for'] = req.ip;
        headers['x-forwarded-proto'] = req.protocol;
        headers['x-forwarded-host'] = req.get('host');

        if (req.user) {
            headers['x-user-id'] = (req.user as any).sub;
        }

        return headers;
    }

    private sendResponse(res: Response, axiosResponse: any): void {
        const { status, data, headers } = axiosResponse;

        const responseHeaders = { ...headers };
        delete responseHeaders['transfer-encoding'];

        res.status(status).set(responseHeaders).send(data);
    }
}
