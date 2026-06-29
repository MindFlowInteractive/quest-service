import { Controller, Get, Param, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { PlayerEventsService } from './player-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';
import { GameSessionService } from '../game-session/services/game-session.service';
import { PagedQueryDto } from './dto/player-action-event.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayerEventsController {
  constructor(
    private readonly playerEventsService: PlayerEventsService,
    private readonly gameSessionService: GameSessionService,
  ) {}

  @Get('players/:id/events')
  @Roles(UserRole.ADMIN)
  async getPlayerEvents(@Param('id') userId: string, @Query() query: PagedQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return this.playerEventsService.getEventsByPlayer(userId, page, limit);
  }

  @Get('sessions/:id/events')
  async getSessionEvents(@Param('id') sessionId: string, @Query() query: PagedQueryDto, @Request() req: any) {
    const page = query.page || 1;
    const limit = query.limit || 50;

    // Only admins or the session owner can fetch session events
    const session = await this.gameSessionService.getById(sessionId);
    if (!session) {
      throw new ForbiddenException('Session not found or access denied');
    }

    const requester = req.user;
    const isAdmin = requester?.role?.name === UserRole.ADMIN;
    if (!isAdmin && session.userId !== requester.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.playerEventsService.getEventsBySession(sessionId, page, limit);
  }
}
