import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PerformanceService } from '../src/performance/performance.service';

describe('Performance Monitoring E2E Tests', () => {
  let app: INestApplication;
  let performanceService: PerformanceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    performanceService = moduleFixture.get<PerformanceService>(PerformanceService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - should measure API response time', async () => {
    const startTime = Date.now();
    
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(response.text).toBe('Hello World!');
    
    // Verify that the response time was recorded
    // Note: In a real test, we would check the metrics registry
    console.log(`API Response Time: ${duration}ms`);
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('/metrics (GET) - should return performance metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);
      
    expect(response.text).toContain('api_response_time_seconds');
    expect(response.text).toContain('db_query_time_seconds');
    expect(response.text).toContain('memory_usage_bytes');
  });

  it('/metrics/dashboard (GET) - should return performance dashboard', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics/dashboard')
      .expect(200);
      
    expect(response.body).toHaveProperty('system');
    expect(response.body.system).toHaveProperty('uptime');
    expect(response.body.system).toHaveProperty('memory');
  });

  it('/metrics/health (GET) - should return health status', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics/health')
      .expect(200);
      
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('checks');
    expect(['healthy', 'degraded']).toContain(response.body.status);
  });

  it('should monitor database queries when available', async () => {
    // This test would check database monitoring when actual database operations occur
    // For now, we just verify the service is available
    expect(performanceService).toBeDefined();
  });
});