import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('SegmentationBootstrap');
  const app = await NestFactory.create(AppModule);

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

  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3023;
  await app.listen(port, '0.0.0.0');

  logger.log(`Segmentation Service is running on port ${port}`);
  logger.log(`Health check available at http://localhost:${port}/api/health`);
}

void bootstrap();
