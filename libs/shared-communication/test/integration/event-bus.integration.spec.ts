import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventPublisher, EventSubscriber, EventBusModule, BaseEvent } from '../../src';

describe('Event Bus Integration Tests', () => {
  let app: INestApplication;
  let publisher: EventPublisher;
  let subscriber: EventSubscriber;
  let receivedEvents: BaseEvent[] = [];

  const testConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'localhost:5672',
      username: process.env.RABBITMQ_USER || 'admin',
      password: process.env.RABBITMQ_PASSWORD || 'rabbitmq123',
      vhost: '/',
      heartbeat: 60,
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
    },
    serviceName: 'test-service',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventBusModule.register(testConfig)],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    publisher = app.get(EventPublisher);
    subscriber = app.get(EventSubscriber);

    // Wait for connections to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    receivedEvents = [];
  });

  describe('Event Publishing and Subscription', () => {
    it('should publish and receive an event', async () => {
      const eventType = 'test.event.basic';
      const queue = 'test-queue-basic';
      const payload = { message: 'Hello World', timestamp: new Date() };

      // Subscribe to event
      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 1,
        },
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        },
      );

      // Wait for subscription to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Publish event
      await publisher.publish(eventType, payload);

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify event was received
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].metadata.eventType).toBe(eventType);
      expect(receivedEvents[0].payload.message).toBe(payload.message);
      expect(receivedEvents[0].metadata.source).toBe('test-service');
      expect(receivedEvents[0].metadata.traceId).toBeDefined();
    }, 10000);

    it('should handle multiple events in order', async () => {
      const eventType = 'test.event.multiple';
      const queue = 'test-queue-multiple';
      const eventCount = 5;

      // Subscribe to event
      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 1,
        },
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Publish multiple events
      for (let i = 0; i < eventCount; i++) {
        await publisher.publish(eventType, { index: i });
      }

      // Wait for all events to be processed
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify all events were received
      expect(receivedEvents.length).toBe(eventCount);
      for (let i = 0; i < eventCount; i++) {
        expect(receivedEvents[i].payload.index).toBe(i);
      }
    }, 15000);

    it('should publish batch events successfully', async () => {
      const eventType = 'test.event.batch';
      const queue = 'test-queue-batch';

      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 5,
        },
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Publish batch
      await publisher.publishBatch([
        { eventType, payload: { id: 1 } },
        { eventType, payload: { id: 2 } },
        { eventType, payload: { id: 3 } },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      expect(receivedEvents.length).toBe(3);
    }, 15000);
  });

  describe('Retry Logic and Error Handling', () => {
    it('should retry failed event processing', async () => {
      const eventType = 'test.event.retry';
      const queue = 'test-queue-retry';
      let attemptCount = 0;

      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 1,
          retryAttempts: 3,
        },
        async (event: BaseEvent) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Simulated failure');
          }
          receivedEvents.push(event);
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await publisher.publish(eventType, { test: 'retry' });

      // Wait for retries
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(attemptCount).toBeGreaterThanOrEqual(3);
      expect(receivedEvents.length).toBe(1);
    }, 15000);

    it('should send to DLQ after max retries', async () => {
      const eventType = 'test.event.dlq';
      const queue = 'test-queue-dlq';
      let attemptCount = 0;

      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 1,
          retryAttempts: 2,
        },
        async (event: BaseEvent) => {
          attemptCount++;
          throw new Error('Always fails');
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await publisher.publish(eventType, { test: 'dlq' });

      // Wait for all retry attempts
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Event should not be in receivedEvents (all attempts failed)
      expect(receivedEvents.length).toBe(0);
      expect(attemptCount).toBeGreaterThanOrEqual(2);
      
      // Note: In a real test, you would verify the message is in the DLQ
      // by consuming from the DLQ queue
    }, 20000);
  });

  describe('Event Metadata', () => {
    it('should include all required metadata', async () => {
      const eventType = 'test.event.metadata';
      const queue = 'test-queue-metadata';

      await subscriber.subscribe(
        {
          eventType,
          queue,
          prefetchCount: 1,
        },
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await publisher.publish(eventType, { data: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(receivedEvents.length).toBe(1);
      const event = receivedEvents[0];
      
      expect(event.metadata).toBeDefined();
      expect(event.metadata.timestamp).toBeInstanceOf(Date);
      expect(event.metadata.traceId).toBeDefined();
      expect(event.metadata.eventType).toBe(eventType);
      expect(event.metadata.version).toBe('1.0');
      expect(event.metadata.source).toBe('test-service');
    }, 10000);
  });
});
