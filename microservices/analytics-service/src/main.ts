import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
  console.log(`Social Service is running on port ${process.env.PORT || 3001}`);
}

bootstrap();
