import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  await app.listen(3101);
  console.log('Consumer Service is running on port 3101');
  console.log('Listening for events...');
}

bootstrap();
