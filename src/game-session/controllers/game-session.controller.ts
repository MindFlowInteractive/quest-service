import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GameSessionService } from '../services/game-session.service';
import { SpectatorService } from '../services/spectator.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import { SpectateSessionDto, ToggleSpectatingDto } from '../dto/spectate-session.dto';

@Controller('game-sessions')
export class GameSessionController {
  constructor(
    private readonly sessionService: GameSessionService,
    private readonly spectatorService: SpectatorService,
  ) {}

  @Post()
  async createSession(@Body() dto: CreateSessionDto) {
    const session = await this.sessionService.create(dto.userId, dto.puzzleId);
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
  async resumeLatestSession(@Param('userId') userId: string) {
    const session = await this.sessionService.resume(userId);
    return {
      message: 'Game session resumed',
      session,
    };
  }

  @Post(':id/resume')
  async resumeSession(
    @Param('id') sessionId: string,
    @Query('userId') userId: string,
  ) {
    const session = await this.sessionService.resumeById(sessionId, userId);
    return {
      message: 'Session resumed successfully',
      session,
    };
  }

  @Get('suspended')
  async getSuspendedSessions(@Query('userId') userId: string) {
    const sessions = await this.sessionService.getSuspendedSessions(userId);
    return {
      message: 'Suspended sessions retrieved',
      sessions,
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

  @Post(':id/spectate')
  async joinSpectate(
    @Param('id') sessionId: string,
    @Body() dto: SpectateSessionDto,
  ) {
    const spectator = await this.spectatorService.joinSession(sessionId, dto);
    return {
      message: 'Joined session as spectator',
      spectator,
    };
  }

  @Delete(':id/spectate')
  @HttpCode(HttpStatus.OK)
  async leaveSpectate(
    @Param('id') sessionId: string,
    @Query('userId') userId: string,
  ) {
    await this.spectatorService.leaveSession(sessionId, userId);
    return {
      message: 'Left spectator view',
    };
  }

  @Get(':id/spectators')
  async getSpectators(@Param('id') sessionId: string) {
    const spectators = await this.spectatorService.getActiveSpectators(sessionId);
    const count = await this.spectatorService.getSpectatorCount(sessionId);
    return {
      message: 'Active spectators retrieved',
      spectators,
      count,
    };
  }

  @Patch(':id/spectate/toggle')
  async toggleSpectating(
    @Param('id') sessionId: string,
    @Query('userId') userId: string,
    @Body() dto: ToggleSpectatingDto,
  ) {
    const session = await this.spectatorService.toggleSpectating(
      sessionId,
      userId,
      dto.spectatingAllowed,
    );
    return {
      message: `Spectating ${dto.spectatingAllowed ? 'enabled' : 'disabled'}`,
      session,
    };
  }
}
