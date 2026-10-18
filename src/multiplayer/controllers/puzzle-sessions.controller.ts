import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { PuzzleSessionService } from '../services/puzzle-session.service';
import { PuzzleSessionAnalyticsService } from '../services/puzzle-session-analytics.service';
import { CreatePuzzleSessionDto } from '../dto/create-puzzle-session.dto';
import { PuzzleSessionQueryDto } from '../dto/puzzle-session-query.dto';
import { AssignRoleBodyDto } from '../dto/assign-role.dto';
import { SendMessageBodyDto } from '../dto/send-message.dto';

@Controller('api/v1/puzzle-sessions')
export class PuzzleSessionsController {
  constructor(
    private readonly service: PuzzleSessionService,
    private readonly analyticsService: PuzzleSessionAnalyticsService,
  ) {}

  @Post()
  create(@Body() dto: CreatePuzzleSessionDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id ?? req.user?.sub);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getState(id);
  }

  @Get(':id/history')
  history(@Param('id') id: string, @Query() query: PuzzleSessionQueryDto) {
    return this.service.history(id, query.limit, query.offset);
  }

  // Co-operative mechanics

  @Get(':id/contributions')
  contributions(@Param('id') id: string) {
    return this.service.getContributions(id);
  }

  @Get(':id/win-condition')
  winCondition(@Param('id') id: string) {
    return this.service.getWinConditionProgress(id);
  }

  @Get(':id/analytics')
  analytics(@Param('id') id: string) {
    return this.analyticsService.get(id);
  }

  @Post(':id/roles')
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleBodyDto,
    @Req() req: any,
  ) {
    return this.service.assignRole(
      { ...dto, sessionId: id },
      req.user?.id ?? req.user?.sub,
    );
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @Query() query: PuzzleSessionQueryDto) {
    return this.service.getMessages(id, query.limit, query.offset);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageBodyDto,
    @Req() req: any,
  ) {
    return this.service.sendMessage(
      { ...dto, sessionId: id },
      req.user?.id ?? req.user?.sub,
    );
  }

  @Post(':id/hints/:hintId')
  discoverHint(
    @Param('id') id: string,
    @Param('hintId') hintId: string,
    @Req() req: any,
  ) {
    return this.service.discoverHint(
      id,
      req.user?.id ?? req.user?.sub,
      hintId,
    );
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    return this.service.complete(id, req.user?.id ?? req.user?.sub);
  }
}
