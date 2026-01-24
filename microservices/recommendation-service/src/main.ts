import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // Hybrid application: HTTP and Microservice (e.g., RabbitMQ or TCP)
    // For simplicity starting with TCP, but can be changed to RabbitMQ matching other services
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: {
            host: '0.0.0.0',
            port: 3001,
        },
    });

    await app.startAllMicroservices();
    await app.listen(3000);
    console.log(`Recommendation service is running on: ${await app.getUrl()}`);
}
bootstrap();
