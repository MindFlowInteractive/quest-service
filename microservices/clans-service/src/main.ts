import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);
  console.log('Clans Service listening on', process.env.PORT || 3002);
}

bootstrap();
