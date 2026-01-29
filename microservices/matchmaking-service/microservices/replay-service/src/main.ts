import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Replay Service API')
    .setDescription(
      'A comprehensive microservice for recording, storing, and replaying puzzle-solving sessions with advanced analytics and sharing capabilities',
    )
    .setVersion('1.0.0')
    .addTag('replay', 'Replay operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // RabbitMQ Microservice connection (optional)
  const rabbitmqUrl =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'replay_queue',
        queueOptions: {
          durable: true,
        },
      },
    });

    console.log('RabbitMQ connection configured');
  } catch (error) {
    console.warn('RabbitMQ connection failed, continuing with HTTP only:', error.message);
  }

  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`Replay Service running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
