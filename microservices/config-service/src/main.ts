import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Config Service API')
    .setDescription('Centralized configuration management service')
    .setVersion('1.0.0')
    .addTag('configurations')
    .addTag('environments')
    .addTag('secrets')
    .addTag('webhooks')
    .addTag('audit-logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVICE_PORT') || 3020;
  const serviceName = configService.get<string>('SERVICE_NAME') || 'config-service';

  await app.listen(port);
  console.log(`${serviceName} is running on port ${port}`);
  console.log(`API documentation available at http://localhost:${port}/api`);
}

bootstrap();
