import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/http-exception.filter';
// import { CustomValidationPipe } from './common/exceptions/validation-exception.pipe'; // Uncomment if you copy this pipe
// import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
// import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port') || 3003;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  const corsOrigin = configService.get<string>('app.cors.origin') || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
    // new CustomValidationPipe(), // Uncomment if you have it
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors (optional for migration service)
  // app.useGlobalInterceptors(
  //   new SanitizeInterceptor(),
  //   new MetricsInterceptor(app.get(MetricsService)),
  // );

  app.setGlobalPrefix(apiPrefix);

  await app.listen(port);

  logger.log(
    `🚀 Migration Service is running on: http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  Logger.error('Failed to start the Migration Service', error);
  process.exit(1);
});