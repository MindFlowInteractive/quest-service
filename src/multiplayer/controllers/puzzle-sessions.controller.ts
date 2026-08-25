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
import { CreatePuzzleSessionDto } from '../dto/create-puzzle-session.dto';
import { PuzzleSessionQueryDto } from '../dto/puzzle-session-query.dto';

@Controller('api/v1/puzzle-sessions')
export class PuzzleSessionsController {
  constructor(private readonly service: PuzzleSessionService) {}

  @Post()
  create(@Body() dto: CreatePuzzleSessionDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id ?? req.user?.sub);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getState(id);
  }

  @Get(':id/history')
  history(
    @Param('id') id: string,
    @Query() query: PuzzleSessionQueryDto,
  ) {
    return this.service.history(id, query.limit, query.offset);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    return this.service.complete(id, req.user?.id ?? req.user?.sub);
  }
}
