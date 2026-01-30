import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { QueueFilterDto } from './dto/queue-filter.dto.js';
import {
  ApproveSubmissionDto,
  RejectSubmissionDto,
  RequestChangesDto,
  FlagContentDto,
} from './dto/moderation-action.dto.js';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  async getQueue(@Query() filterDto: QueueFilterDto) {
    return this.moderationService.getQueue(filterDto);
  }

  @Post('queue/:id/claim')
  async claimItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-moderator-id') moderatorId: string,
  ) {
    return this.moderationService.claimItem(id, moderatorId);
  }

  @Post(':submissionId/approve')
  async approve(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() approveDto: ApproveSubmissionDto,
    @Headers('x-moderator-id') moderatorId: string,
  ) {
    return this.moderationService.approve(submissionId, moderatorId, approveDto);
  }

  @Post(':submissionId/reject')
  async reject(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() rejectDto: RejectSubmissionDto,
    @Headers('x-moderator-id') moderatorId: string,
  ) {
    return this.moderationService.reject(submissionId, moderatorId, rejectDto);
  }

  @Post(':submissionId/request-changes')
  async requestChanges(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() requestChangesDto: RequestChangesDto,
    @Headers('x-moderator-id') moderatorId: string,
  ) {
    return this.moderationService.requestChanges(submissionId, moderatorId, requestChangesDto);
  }

  @Post(':contentId/flag')
  async flagContent(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Body() flagDto: FlagContentDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.moderationService.flagContent(contentId, userId, flagDto);
  }

  @Get('stats')
  async getStats() {
    return this.moderationService.getStats();
  }

  @Post('queue/:id/escalate')
  async escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.moderationService.escalate(id, reason);
  }
}
