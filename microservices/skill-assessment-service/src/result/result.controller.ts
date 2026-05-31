import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResultService } from './result.service';
import { CreateResultDto } from './dto/create-result.dto';

@ApiTags('results')
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new result' })
  @ApiResponse({ status: 201, description: 'Result created successfully' })
  create(@Body() createResultDto: CreateResultDto) {
    return this.resultService.create(createResultDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all results' })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  findAll() {
    return this.resultService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get result by ID' })
  @ApiResponse({ status: 200, description: 'Result retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.resultService.findOne(id);
  }

  @Get('assessment/:assessmentId')
  @ApiOperation({ summary: 'Get results by assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment results retrieved successfully' })
  findByAssessment(@Param('assessmentId') assessmentId: string) {
    return this.resultService.findByAssessment(assessmentId);
  }

  @Get('assessment/:assessmentId/average-score')
  @ApiOperation({ summary: 'Calculate average score for an assessment' })
  @ApiResponse({ status: 200, description: 'Average score calculated successfully' })
  calculateAverageScore(@Param('assessmentId') assessmentId: string) {
    return this.resultService.calculateAverageScore(assessmentId);
  }

  @Get('test/:testId')
  @ApiOperation({ summary: 'Get results by test ID' })
  @ApiResponse({ status: 200, description: 'Test results retrieved successfully' })
  findByTest(@Param('testId') testId: string) {
    return this.resultService.findByTest(testId);
  }
}
