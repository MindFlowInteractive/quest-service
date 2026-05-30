import { NestFactory } from '@nestjs/core';
import { ExportModule } from './export/export.module';

async function bootstrap() {
  const app = await NestFactory.create(ExportModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3020);
}
bootstrap();
