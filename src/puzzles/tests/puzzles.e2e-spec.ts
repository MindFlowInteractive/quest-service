import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Puzzles E2E', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Mock login to get JWT token
    // In a real E2E test, we would hit the auth endpoint
    // For now, assuming we can get a valid token or mock the guard
    jwtToken = 'mock-jwt-token'; 
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/puzzles/:id/ratings (POST)', () => {
    it('should submit a rating', async () => {
      // 1. Create puzzle via API or seed
      // 2. Submit rating
      // return request(app.getHttpServer())
      //   .post('/api/puzzles/puzzle-id/ratings')
      //   .set('Authorization', `Bearer ${jwtToken}`)
      //   .send({ rating: 5 })
      //   .expect(201);
    });
  });

  describe('/api/puzzles/:id/reviews (GET)', () => {
    it('should return paginated reviews', () => {
      // return request(app.getHttpServer())
      //   .get('/api/puzzles/puzzle-id/reviews')
      //   .expect(200)
      //   .expect((res) => {
      //     expect(res.body).toHaveProperty('reviews');
      //     expect(res.body).toHaveProperty('total');
      //   });
    });
  });
});
