import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Quiz } from './quiz.entity';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  create(@Body() body: Partial<Quiz>): Promise<Quiz> {
    return this.quizService.create(body);
  }

  @Get()
  findAll(@Query('category') category?: string): Promise<Quiz[]> {
    if (category) return this.quizService.findByCategory(category);
    return this.quizService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Quiz | null> {
    return this.quizService.findOne(id);
  }
}