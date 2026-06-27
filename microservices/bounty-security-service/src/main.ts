import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bounty Security Service')
    .setDescription(
      'Bug-bounty service: vulnerability reports, severity assessment, workflow, rewards, researcher reputation, and leaderboards.',
    )
    .setVersion('1.0')
    .addTag('reports', 'Vulnerability reports — submission & workflow')
    .addTag('bounties', 'Bounty programs and reward tiers')
    .addTag('researchers', 'Security researcher profiles & reputation')
    .addTag('rewards', 'Reward payments to researchers')
    .addTag('leaderboard', 'Reputation and reward leaderboards')
    .addTag('health', 'Liveness/readiness probe')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.SERVICE_PORT || '3030', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`Bounty Security Service running on port ${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api`);
}

bootstrap();
