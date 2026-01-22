import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // RabbitMQ Microservice connection
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq123@rabbitmq:5672';
  
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

  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Replay service (refined) is running on port ${port}`);
}
bootstrap();
