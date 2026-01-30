import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_LEVEL
      ? [process.env.LOG_LEVEL as any]
      : ['log', 'error', 'warn']
  });
  app.setGlobalPrefix('api');
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const env = process.env.NODE_ENV || 'development';
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `Cache service listening on port ${port} [${env}]`
  );
}

bootstrap();
