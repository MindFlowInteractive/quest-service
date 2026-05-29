import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
  ) {}

  create(data: Partial<Quiz>): Promise<Quiz> {
    return this.quizRepo.save(this.quizRepo.create(data));
  }

  findAll(): Promise<Quiz[]> {
    return this.quizRepo.find();
  }

  findOne(id: string): Promise<Quiz | null> {
    return this.quizRepo.findOneBy({ id });
  }

  findByCategory(category: string): Promise<Quiz[]> {
    return this.quizRepo.findBy({ category });
  }
}