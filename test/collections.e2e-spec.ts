import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsModule } from '../src/collections/collections.module';
import { DataSource } from 'typeorm';

describe('Collections E2E', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [__dirname + '/../src/collections/entities/*.ts', __dirname + '/../src/collections/entities/*.js'],
          synchronize: true,
          logging: false,
        }),
        CollectionsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    ds = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create category and collection, assign puzzle, track progress and give reward once', async () => {
    // create category
    const resCat = await ds.manager.insert('category', { name: 'Logic', slug: 'logic' });
    const catId = resCat.identifiers[0].id;

    // create collection
    const createRes = await request(app.getHttpServer()).post('/collections').send({ title: 'Beginner Pack', description: 'A small set', category_id: catId, difficulty: 1, is_featured: true, reward_type: 'points', reward_value: 100 });
    expect([200, 201]).toContain(createRes.status);
    const collection = createRes.body;

    // assign puzzles
    const puzzle1 = '11111111-1111-1111-1111-111111111111';
    const puzzle2 = '22222222-2222-2222-2222-222222222222';
    await request(app.getHttpServer()).post(`/collections/${collection.id}/assign`).send({ puzzle_id: puzzle1, order_index: 1 });
    await request(app.getHttpServer()).post(`/collections/${collection.id}/assign`).send({ puzzle_id: puzzle2, order_index: 2 });

    // user completes first puzzle
    const user = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const res1 = await request(app.getHttpServer()).post('/collections/complete').send({ user_id: user, puzzle_id: puzzle1 });
    expect([200, 201]).toContain(res1.status);

    // progress should reflect 1/2
    const getRes1 = await request(app.getHttpServer()).get(`/collections/${collection.id}`).query({ user_id: user }).expect(200);
    expect(getRes1.body.progress.completed_puzzles_count).toBe(1);
    expect(Number(getRes1.body.progress.progress_percentage)).toBeCloseTo(50);

    // complete second puzzle -> triggers completion and reward
    const res2 = await request(app.getHttpServer()).post('/collections/complete').send({ user_id: user, puzzle_id: puzzle2 });
    expect([200, 201]).toContain(res2.status);

    const getRes2 = await request(app.getHttpServer()).get(`/collections/${collection.id}`).query({ user_id: user }).expect(200);
    expect(getRes2.body.progress.completed_puzzles_count).toBe(2);
    expect(getRes2.body.progress.is_completed).toBe(true);

    // reward recorded once
    const rewards = await ds.manager.query('SELECT * FROM user_rewards WHERE user_id = $1', [user]);
    expect(rewards.length).toBe(1);

    // re-completing same puzzle should be idempotent and not double-grant
    const res3 = await request(app.getHttpServer()).post('/collections/complete').send({ user_id: user, puzzle_id: puzzle1 });
    expect([200, 201]).toContain(res3.status);
    const rewards2 = await ds.manager.query('SELECT * FROM user_rewards WHERE user_id = $1', [user]);
    expect(rewards2.length).toBe(1);
  });

  it('featured and search should work', async () => {
    const featured = await request(app.getHttpServer()).get('/collections/featured').expect(200);
    expect(Array.isArray(featured.body)).toBe(true);

    const search = await request(app.getHttpServer()).get('/collections/search').query({ q: 'Beginner' }).expect(200);
    expect(search.body.length).toBeGreaterThan(0);
  });
});
