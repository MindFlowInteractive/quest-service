import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonConfig } from './logging/winston.config';
import { CorrelationIdMiddleware } from './logging/correlation-id.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger(winstonConfig),
    });

    const configService = app.get(ConfigService);

    app.use(helmet());

    app.enableCors({
        origin: configService.get<string[]>('cors.origins'),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
        exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.use(new CorrelationIdMiddleware().use);

    const port = configService.get<number>('port');
    await app.listen(port);

    console.log(`API Gateway is running on: http://localhost:${port}`);
}

bootstrap();
