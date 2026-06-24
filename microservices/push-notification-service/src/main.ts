import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Quest Push Notification Service')
    .setDescription('Mobile and web push notification delivery API')
    .setVersion(process.env.SERVICE_VERSION || '1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.SERVICE_PORT || process.env.PORT || 3020);
  await app.listen(port, '0.0.0.0');
  console.log(`Push Notification Service is running on port ${port}`);
}

bootstrap();
