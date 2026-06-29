import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(process.env.PORT || 4005);

  console.log(
    `Blockchain Sync Service running on port ${process.env.PORT}`,
  );
}

bootstrap();