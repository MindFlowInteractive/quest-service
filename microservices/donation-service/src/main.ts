import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableShutdownHooks();
  const port = process.env.PORT ? Number(process.env.PORT) : 3011;
  await app.listen(port);
  console.log(`Donation Service listening on port ${port}`);
}

bootstrap();
