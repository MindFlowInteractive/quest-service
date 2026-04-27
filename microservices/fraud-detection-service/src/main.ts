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
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Fraud Detection Service')
    .setDescription(
      'Pattern analysis and anomaly detection to prevent cheating and abuse',
    )
    .setVersion('1.0')
    .addTag('fraud-detection')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.SERVICE_PORT || '3020', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Fraud Detection Service running on port ${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api`);
}

bootstrap();
