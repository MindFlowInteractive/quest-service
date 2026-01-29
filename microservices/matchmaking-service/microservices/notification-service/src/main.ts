import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableCors();

  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.log(`Notification Service is running on port ${port}`);
}

bootstrap();
