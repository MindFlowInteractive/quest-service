import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Cache Service E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/cache/:key (GET) should cache and serve values', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/cache/e2e:1')
      .expect(200);

    expect(response.body).toHaveProperty('key', 'e2e:1');
    expect(response.body).toHaveProperty('value');
  });

  it('/api/cache/warm (POST) should warm keys', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/cache/warm')
      .send({ keys: ['e2e:warm:1', 'e2e:warm:2'], ttl: 60 })
      .expect(200);

    expect(response.body).toHaveProperty('warmed', 2);
  });

  it('/api/cache/invalidate (POST) should invalidate keys', async () => {
    await request(app.getHttpServer())
      .get('/api/cache/e2e:inv:1')
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/cache/invalidate')
      .send({ key: 'e2e:inv:1' })
      .expect(200);

    expect(response.body).toHaveProperty('invalidated', 1);
  });

  it('/api/cache/invalidate (POST) should invalidate by pattern', async () => {
    await request(app.getHttpServer())
      .post('/api/cache/warm')
      .send({ keys: ['e2e:pat:1', 'e2e:pat:2'], ttl: 60 })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/cache/invalidate')
      .send({ pattern: 'e2e:pat:*' })
      .expect(200);

    expect(response.body.invalidated).toBeGreaterThan(0);
  });

  it('/api/cache/stats (GET) should return hit/miss counts', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/cache/stats')
      .expect(200);

    expect(response.body).toHaveProperty('hits');
    expect(response.body).toHaveProperty('misses');
    expect(typeof response.body.hits).toBe('number');
    expect(typeof response.body.misses).toBe('number');
  });

  it('/api/cache/lock/acquire (POST) should acquire locks', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/cache/lock/acquire')
      .send({ resource: 'e2e-test', ttl: 5000 })
      .expect(200);

    expect(response.body).toHaveProperty('acquired', true);
    expect(response.body).toHaveProperty('lock');
    expect(response.body.lock).toHaveProperty('key');
    expect(response.body.lock).toHaveProperty('token');
  });

  it('/api/cache/lock/acquire (POST) should reject concurrent locks', async () => {
    const acq1 = await request(app.getHttpServer())
      .post('/api/cache/lock/acquire')
      .send({ resource: 'e2e-concurrent', ttl: 5000 })
      .expect(200);

    const acq2 = await request(app.getHttpServer())
      .post('/api/cache/lock/acquire')
      .send({ resource: 'e2e-concurrent', ttl: 500 })
      .expect(200);

    expect(acq1.body.acquired).toBe(true);
    expect(acq2.body.acquired).toBe(false);

    // Release first lock
    await request(app.getHttpServer())
      .post('/api/cache/lock/release')
      .send({
        key: acq1.body.lock.key,
        token: acq1.body.lock.token
      })
      .expect(200);
  });

  it('/api/cache/lock/release (POST) should release locks', async () => {
    const acq = await request(app.getHttpServer())
      .post('/api/cache/lock/acquire')
      .send({ resource: 'e2e-release', ttl: 5000 })
      .expect(200);

    const release = await request(app.getHttpServer())
      .post('/api/cache/lock/release')
      .send({
        key: acq.body.lock.key,
        token: acq.body.lock.token
      })
      .expect(200);

    expect(release.body).toHaveProperty('released', true);
  });

  it('should handle TTL expiration', async () => {
    // Set a key with short TTL
    await request(app.getHttpServer())
      .get('/api/cache/e2e:ttl?ttl=1')
      .expect(200);

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 1500));

    // Second request should miss and refetch
    const response = await request(app.getHttpServer())
      .get('/api/cache/e2e:ttl')
      .expect(200);

    expect(response.body).toHaveProperty('value');
  });
});
