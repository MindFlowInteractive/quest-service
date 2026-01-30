import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EmailService E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET / - should return service info', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('email-service');
          expect(res.body.version).toBeDefined();
        });
    });
  });

  describe('Templates API', () => {
    let templateId: string;

    it('POST /templates - should create a template', () => {
      return request(app.getHttpServer())
        .post('/templates')
        .send({
          name: 'test-welcome-template',
          subject: 'Welcome, {{name}}!',
          htmlBody: '<h1>Welcome, {{name}}!</h1><p>Thanks for joining us.</p>',
          textBody: 'Welcome, {{name}}! Thanks for joining us.',
          category: 'welcome',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe('test-welcome-template');
          templateId = res.body.id;
        });
    });

    it('GET /templates - should list templates', () => {
      return request(app.getHttpServer())
        .get('/templates')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /templates/:id - should get template by ID', () => {
      return request(app.getHttpServer())
        .get(`/templates/${templateId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(templateId);
        });
    });

    it('POST /templates/render - should render template', () => {
      return request(app.getHttpServer())
        .post('/templates/render')
        .send({
          templateName: 'test-welcome-template',
          variables: { name: 'John Doe' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.subject).toBe('Welcome, John Doe!');
          expect(res.body.html).toContain('Welcome, John Doe!');
        });
    });

    it('POST /templates/:id/preview - should preview template', () => {
      return request(app.getHttpServer())
        .post(`/templates/${templateId}/preview`)
        .send({ variables: { name: 'Jane Doe' } })
        .expect(201)
        .expect((res) => {
          expect(res.body.subject).toContain('Jane Doe');
        });
    });

    it('PUT /templates/:id - should update template', () => {
      return request(app.getHttpServer())
        .put(`/templates/${templateId}`)
        .send({ description: 'Updated description' })
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe('Updated description');
          expect(res.body.version).toBe(2);
        });
    });

    it('DELETE /templates/:id - should delete template', () => {
      return request(app.getHttpServer())
        .delete(`/templates/${templateId}`)
        .expect(204);
    });
  });

  describe('Emails API', () => {
    it('POST /emails/send - should queue an email', () => {
      return request(app.getHttpServer())
        .post('/emails/send')
        .send({
          toEmail: 'test@example.com',
          toName: 'Test User',
          subject: 'Test Email',
          htmlContent: '<h1>Test</h1><p>This is a test email.</p>',
          textContent: 'Test. This is a test email.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('pending');
          expect(res.body.toEmail).toBe('test@example.com');
        });
    });

    it('GET /emails/stats - should return email statistics', () => {
      return request(app.getHttpServer())
        .get('/emails/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBeDefined();
          expect(res.body.sent).toBeDefined();
          expect(res.body.deliveryRate).toBeDefined();
        });
    });
  });

  describe('Unsubscribe API', () => {
    it('POST /unsubscribe - should unsubscribe email', () => {
      return request(app.getHttpServer())
        .post('/unsubscribe')
        .send({
          email: 'unsubscribe-test@example.com',
          category: 'marketing',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('unsubscribe-test@example.com');
          expect(res.body.category).toBe('marketing');
          expect(res.body.isActive).toBe(true);
        });
    });

    it('GET /unsubscribe/status/:email - should return unsubscribe status', () => {
      return request(app.getHttpServer())
        .get('/unsubscribe/status/unsubscribe-test@example.com')
        .expect(200)
        .expect((res) => {
          expect(res.body.isUnsubscribed).toBe(true);
          expect(res.body.categories).toContain('marketing');
        });
    });

    it('GET /unsubscribe/check - should check if unsubscribed', () => {
      return request(app.getHttpServer())
        .get('/unsubscribe/check')
        .query({ email: 'unsubscribe-test@example.com', type: 'marketing' })
        .expect(200)
        .expect((res) => {
          expect(res.body.isUnsubscribed).toBe(true);
        });
    });

    it('POST /unsubscribe/resubscribe - should resubscribe email', () => {
      return request(app.getHttpServer())
        .post('/unsubscribe/resubscribe')
        .send({
          email: 'unsubscribe-test@example.com',
          category: 'marketing',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Tracking API', () => {
    it('GET /tracking/stats - should return tracking statistics', () => {
      return request(app.getHttpServer())
        .get('/tracking/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.sent).toBeDefined();
          expect(res.body.delivered).toBeDefined();
          expect(res.body.opened).toBeDefined();
        });
    });

    it('GET /tracking/bounces/stats - should return bounce statistics', () => {
      return request(app.getHttpServer())
        .get('/tracking/bounces/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.hard).toBeDefined();
          expect(res.body.soft).toBeDefined();
          expect(res.body.transient).toBeDefined();
        });
    });
  });

  describe('Webhooks API', () => {
    it('POST /webhooks/sendgrid - should handle SendGrid webhook', () => {
      return request(app.getHttpServer())
        .post('/webhooks/sendgrid')
        .send([
          {
            email: 'test@example.com',
            timestamp: Date.now(),
            event: 'delivered',
            sg_message_id: 'test-message-id',
          },
        ])
        .expect(200)
        .expect((res) => {
          expect(res.body.received).toBe(true);
        });
    });

    it('POST /webhooks/ses - should handle SES webhook', () => {
      return request(app.getHttpServer())
        .post('/webhooks/ses')
        .send({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Delivery',
            mail: { messageId: 'test-ses-message-id' },
          }),
          MessageId: 'test-notification-id',
          Timestamp: new Date().toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.received).toBe(true);
        });
    });
  });
});
