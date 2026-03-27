import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { MultiplayerService } from '../services/multiplayer.service';
import { CreateMultiplayerSessionDto } from '../dto/create-multiplayer-session.dto';
import { JoinSessionDto } from '../dto/join-session.dto';

@Controller('sessions/multiplayer')
export class MultiplayerSessionController {
  constructor(private readonly multiplayerService: MultiplayerService) {}

  @Post()
  async createMultiplayerSession(@Body() dto: CreateMultiplayerSessionDto) {
    const player = {
      id: dto.userId,
      username: dto.username,
      skillLevel: dto.skillLevel,
      ready: false,
      score: 0,
      solvedPuzzles: [],
    };

    const session = await this.multiplayerService.createMultiplayerSession(
      dto.type,
      player,
      dto.settings,
      dto.puzzleId
    );

    return {
      message: 'Multiplayer session created',
      session: {
        id: session.id,
        inviteCode: session.inviteCode,
        type: session.type,
        status: session.status,
        players: session.players,
        settings: session.settings,
        puzzleId: session.puzzleId,
      },
    };
  }

  @Post('join/:code')
  async joinSessionByCode(@Param('code') code: string, @Body() dto: JoinSessionDto) {
    const player = {
      id: dto.userId,
      username: dto.username,
      skillLevel: dto.skillLevel,
      ready: false,
      score: 0,
      solvedPuzzles: [],
    };

    const session = await this.multiplayerService.joinSessionByCode(code, player);
    
    if (!session) {
      return {
        message: 'Failed to join session',
        error: 'Invalid invite code or session is full',
      };
    }

    return {
      message: 'Joined session successfully',
      session: {
        id: session.id,
        inviteCode: session.inviteCode,
        type: session.type,
        status: session.status,
        players: session.players,
        settings: session.settings,
        puzzleId: session.puzzleId,
      },
    };
  }

  @Get(':code')
  async getSessionByCode(@Param('code') code: string) {
    const session = await this.multiplayerService.getSessionByCode(code);
    
    if (!session) {
      return {
        message: 'Session not found',
        error: 'Invalid invite code',
      };
    }

    return {
      message: 'Session retrieved',
      session: {
        id: session.id,
        inviteCode: session.inviteCode,
        type: session.type,
        status: session.status,
        playerCount: session.players.length,
        maxPlayers: session.settings.maxPlayers,
        settings: session.settings,
      },
    };
  }
}
