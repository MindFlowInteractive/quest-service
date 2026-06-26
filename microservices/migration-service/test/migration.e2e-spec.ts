import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('MigrationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/migrations/apply (POST) - should fail if missing body params', () => {
    return request(app.getHttpServer())
      .post('/migrations/apply')
      .send({})
      .expect(400);
  });

  // Since we don't have a real separate db set up for testing dynamically inside e2e without
  // more complex config, we just test that the endpoints are up and input validation is working.
  it('/migrations/rollback/test-id (POST) - should fail if missing body params', () => {
    return request(app.getHttpServer())
      .post('/migrations/rollback/test-id')
      .send({})
      .expect(400);
  });
});
