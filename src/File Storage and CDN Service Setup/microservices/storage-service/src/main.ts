import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Start server
  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`
    
      Storage Service Running             
      Port: ${port}                       
      Environment: ${process.env.NODE_ENV || 'development'}      

  `);
}

bootstrap();