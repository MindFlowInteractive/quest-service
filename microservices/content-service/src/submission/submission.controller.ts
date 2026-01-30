import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { SubmissionService } from './submission.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { SubmissionFilterDto } from './dto/submission-filter.dto.js';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post(':contentId')
  async submit(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.submissionService.submit(contentId, userId, createSubmissionDto);
  }

  @Get()
  async findAll(
    @Query() filterDto: SubmissionFilterDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (userId) {
      return this.submissionService.findByUser(userId, filterDto);
    }
    return this.submissionService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.submissionService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.submissionService.cancel(id, userId);
  }

  @Post(':id/resubmit')
  async resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.submissionService.resubmit(id, userId, createSubmissionDto);
  }
}
