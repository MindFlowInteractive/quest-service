import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { CustomValidationPipe } from './common/exceptions/validation-exception.pipe';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/http-exception.filter';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { MetricsInterceptor } from './common/metrics/metrics.interceptor';
import { MetricsService } from './common/metrics/metrics.service';
import * as Sentry from '@sentry/node';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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
  // ThrottlerGuard is auto-provided by ThrottlerModule, use app.get() instead
  // app.useGlobalGuards(new ThrottlerGuard());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new SanitizeInterceptor(),
    new MetricsInterceptor(app.get(MetricsService)),
  );

  app.setGlobalPrefix(apiPrefix);

  // Connect RabbitMQ microservice for stale token cleanup
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://admin:rabbitmq123@rabbitmq:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'notification_stale_tokens_queue',
      queueOptions: { durable: true },
      noAck: false,
    },
  });
  await app.startAllMicroservices();

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
