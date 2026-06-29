import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { Quiz } from './quiz.entity';

describe('QuizService', () => {
  let service: QuizService;
  const mockRepo = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'uuid', ...d })),
    find: jest.fn(() => Promise.resolve([])),
    findOneBy: jest.fn(() => Promise.resolve(null)),
    findBy: jest.fn(() => Promise.resolve([])),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: getRepositoryToken(Quiz), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(QuizService);
  });

  it('creates a quiz', async () => {
    const quiz = await service.create({ title: 'Test Quiz' });
    expect(quiz.title).toBe('Test Quiz');
  });

  it('returns all quizzes', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});