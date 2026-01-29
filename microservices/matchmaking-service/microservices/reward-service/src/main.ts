import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Set global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVICE_PORT') || 3006;
  
  await app.listen(port);
  console.log(`Reward Service is running on port ${port}`);
}
bootstrap();
