import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Badge Service')
    .setDescription(
      'Gamification Badge & Credential Service',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 4010);
}

bootstrap();