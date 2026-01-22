import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { CustomValidationPipe } from './common/exceptions/validation-exception.pipe';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/http-exception.filter';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import * as Sentry from '@sentry/node';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '', // Set your Sentry DSN in environment variables
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  // Access nested config properties from appConfig
  const port = configService.get('app.port') || 3000;
  const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
  const corsOrigin =
    configService.get('app.cors.origin') || 'http://localhost:3000';

  // Security middleware
  app.use(helmet(
    {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }
  ));

  // CORS configuration
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });



  // Global validation pipe
  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),);

  //Global Guards 
  app.useGlobalGuards(new ThrottlerGuard());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global sanitize interceptor
  app.useGlobalInterceptors(new SanitizeInterceptor());

  app.setGlobalPrefix(apiPrefix);

  await app.listen(port);

  logger.log(
    `🚀 LogiQuest Backend is running on: http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  Logger.error('Failed to start the application', error);
  process.exit(1);
});
