import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SmsService E2E', () => {
  let app: INestApplication;
  let templateName: string;
  let messageId: string;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqljs';
    process.env.DB_NAME = `sms-service-test-${Date.now()}`;
    process.env.SMS_PROVIDER = 'mock';
    process.env.SMS_DEBUG_EXPOSE_CODES = 'true';
    process.env.SMS_DISPATCH_INTERVAL_MS = '50';

    templateName = `alert-template-${Date.now()}`;

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

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('POST /templates creates an SMS template', () => {
    return request(app.getHttpServer())
      .post('/templates')
      .send({
        name: templateName,
        body: 'Hello {{name}}, your quest starts at {{time}}.',
        category: 'alert',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe(templateName);
      });
  });

  it('POST /sms/send-templated sends through the mock provider', () => {
    return request(app.getHttpServer())
      .post('/sms/send-templated')
      .send({
        phoneNumber: '+14155552671',
        templateName,
        variables: {
          name: 'Ayo',
          time: '08:00',
        },
        type: 'alert',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(['sent', 'delivered']).toContain(res.body.status);
        expect(res.body.provider).toBe('mock');
        messageId = res.body.id;
      });
  });

  it('GET /sms/history returns tracked messages', () => {
    return request(app.getHttpServer())
      .get('/sms/history')
      .query({ phoneNumber: '+14155552671' })
      .expect(200)
      .expect((res) => {
        expect(res.body.total).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(res.body.messages)).toBe(true);
      });
  });

  it('GET /receipts/message/:messageId returns receipt events', () => {
    return request(app.getHttpServer())
      .get(`/receipts/message/${messageId}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('POST /otp/send and /otp/verify completes OTP flow', async () => {
    const sendResponse = await request(app.getHttpServer())
      .post('/otp/send')
      .send({
        phoneNumber: '+14155552672',
        purpose: 'login',
      })
      .expect(201);

    expect(sendResponse.body.otpId).toBeDefined();
    expect(sendResponse.body.debugCode).toHaveLength(6);

    await request(app.getHttpServer())
      .post('/otp/verify')
      .send({
        phoneNumber: '+14155552672',
        purpose: 'login',
        code: sendResponse.body.debugCode,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.verified).toBe(true);
      });
  });

  it('GET /sms/stats exposes analytics', () => {
    return request(app.getHttpServer())
      .get('/sms/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body.total).toBeGreaterThanOrEqual(1);
        expect(res.body.deliveryRate).toBeDefined();
      });
  });
});
