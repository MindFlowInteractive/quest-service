import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
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
  app.use(helmet());

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
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

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
