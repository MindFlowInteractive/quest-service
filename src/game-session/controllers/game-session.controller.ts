import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GameSessionService } from '../services/game-session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';

@Controller('game-sessions')
export class GameSessionController {
  constructor(private readonly sessionService: GameSessionService) {}

  @Post()
  async createSession(@Body() dto: CreateSessionDto) {
    const session = await this.sessionService.create(dto.userId);
    return {
      message: 'Game session created',
      session,
    };
  }

  @Patch(':id')
  async updateState(
    @Param('id') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const session = await this.sessionService.updateState(
      sessionId,
      dto.partialState,
    );
    return {
      message: 'Game session state updated',
      session,
    };
  }

  @Get('resume/:userId')
  async resumeSession(@Param('userId') userId: string) {
    const session = await this.sessionService.resume(userId);
    return {
      message: 'Game session resumed',
      session,
    };
  }

  @Post(':id/end')
  async endSession(
    @Param('id') sessionId: string,
    @Query('status') status: 'COMPLETED' | 'ABANDONED',
  ) {
    const session = await this.sessionService.end(sessionId, status);
    return {
      message: `Game session marked as ${status}`,
      session,
    };
  }
}
