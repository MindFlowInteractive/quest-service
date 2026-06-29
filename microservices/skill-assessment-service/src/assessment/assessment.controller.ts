import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assessments' })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  findAll() {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(id);
  }

  @Get('player/:playerId')
  @ApiOperation({ summary: 'Get assessments by player ID' })
  @ApiResponse({ status: 200, description: 'Player assessments retrieved successfully' })
  findByPlayer(@Param('playerId') playerId: string) {
    return this.assessmentService.findByPlayer(playerId);
  }

  @Get('player/:playerId/latest')
  @ApiOperation({ summary: 'Get latest assessment for a player' })
  @ApiResponse({ status: 200, description: 'Latest assessment retrieved successfully' })
  findLatestByPlayer(@Param('playerId') playerId: string) {
    return this.assessmentService.findLatestByPlayer(playerId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment started successfully' })
  startAssessment(@Param('id') id: string) {
    return this.assessmentService.startAssessment(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment completed successfully' })
  completeAssessment(@Param('id') id: string) {
    return this.assessmentService.completeAssessment(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  update(@Param('id') id: string, @Body() updateAssessmentDto: UpdateAssessmentDto) {
    return this.assessmentService.update(id, updateAssessmentDto);
  }

  @Post(':id/adjust-difficulty')
  @ApiOperation({ summary: 'Adjust assessment difficulty based on performance' })
  @ApiResponse({ status: 200, description: 'Difficulty adjusted successfully' })
  adjustDifficulty(@Param('id') id: string, @Body('performance') performance: number) {
    return this.assessmentService.adjustDifficulty(id, performance);
  }

  @Post(':id/identify-skill-gaps')
  @ApiOperation({ summary: 'Identify skill gaps from assessment results' })
  @ApiResponse({ status: 200, description: 'Skill gaps identified successfully' })
  identifySkillGaps(@Param('id') id: string) {
    return this.assessmentService.identifySkillGaps(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  remove(@Param('id') id: string) {
    return this.assessmentService.remove(id);
  }
}
